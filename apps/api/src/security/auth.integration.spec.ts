import { Test } from "@nestjs/testing";
import { ValidationPipe, type INestApplication } from "@nestjs/common";
import request, { type Response } from "supertest";
import type { Server } from "node:http";
import type { Express } from "express";
import { randomUUID, createHmac } from "node:crypto";
import * as bcrypt from "bcrypt";
import { AuthModule } from "@/modules/auth/auth.module";
import { PrismaModule } from "@/prisma/prisma.module";
import { PrismaService } from "@/prisma/prisma.service";
import { InfrastructureModule } from "@/infrastructure/infrastructure.module";
import { EmailService } from "@/infrastructure/email.service";
import { RateLimitService } from "./services/rate-limit.service";
import { TokenService } from "./services/token.service";

const integration =
  process.env.AUTH_INTEGRATION === "1" ? describe : describe.skip;
jest.setTimeout(60_000);

integration("Auth HTTP and database invariants", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let clinicId: string;
  const run = randomUUID();
  const testIp = "2001:db8:" + run.slice(0, 4) + ":" + run.slice(4, 8) + "::1";
  const ownerEmail = "owner-" + run + "@example.invalid";
  const staffEmail = "staff-" + run + "@example.invalid";
  const unknownEmail = "unknown-" + run + "@example.invalid";
  const sent = new Map<string, string>();
  let failDelivery = false;
  const password = "InitialPass123";
  let ownerId: string;
  let ownerToken: string;
  let setupToken: string;
  let resetToken: string;
  let api: ReturnType<typeof request.agent>;
  const body = (response: Response) => response.body as Record<string, string>;

  const code = (email: string) => sent.get(email)!.match(/<p>(\d{6})<\/p>/)![1];
  async function clearSends(email: string) {
    const ids = ["otp-send-hour", "otp-send-cooldown"].map((scope) =>
      createHmac("sha256", process.env.JWT_SECRET!)
        .update(scope + ":" + email)
        .digest("hex"),
    );
    await prisma.authRateLimit.deleteMany({ where: { id: { in: ids } } });
  }

  beforeAll(async () => {
    process.env.JWT_SECRET ??= randomUUID() + randomUUID();
    const module = await Test.createTestingModule({
      imports: [PrismaModule, InfrastructureModule, AuthModule],
    })
      .overrideProvider(EmailService)
      .useValue({
        isEnabled: true,
        send: (input: { to: string; html: string }) => {
          if (failDelivery)
            return Promise.reject(new Error("provider unavailable"));
          sent.set(input.to, input.html);
          return Promise.resolve({ skipped: false, id: "test" });
        },
      })
      .compile();
    app = module.createNestApplication();
    (app.getHttpAdapter().getInstance() as Express).set("trust proxy", 1);
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();
    api = request
      .agent(app.getHttpServer() as Server)
      .set("X-Forwarded-For", testIp);
    prisma = app.get(PrismaService);
    clinicId = (
      await prisma.clinic.create({ data: { name: "Auth verification " + run } })
    ).id;
    const hash = await bcrypt.hash(password, 12);
    for (const [email, role] of [
      [ownerEmail, "owner"],
      [staffEmail, "practitioner"],
    ] as const) {
      const user = await prisma.user.create({
        data: {
          email,
          passwordHash: hash,
          mustChangePassword: role === "practitioner",
          clinicUsers: {
            create: { clinicId, role, name: "Synthetic auth fixture" },
          },
        },
      });
      if (role === "owner") ownerId = user.id;
    }
  }, 60_000);

  afterAll(async () => {
    if (prisma && clinicId) {
      await prisma.authOtpChallenge.deleteMany({
        where: { email: { in: [ownerEmail, staffEmail, unknownEmail] } },
      });
      await prisma.clinicUser.deleteMany({ where: { clinicId } });
      await prisma.user.deleteMany({
        where: { email: { in: [ownerEmail, staffEmail] } },
      });
      await prisma.clinic.delete({ where: { id: clinicId } });
      for (const email of [ownerEmail, staffEmail, unknownEmail])
        await clearSends(email);
      const keys = [
        ["auth-ip", testIp],
        ["integration", run],
        ...[ownerEmail, staffEmail, unknownEmail].map((email) => [
          "login-email",
          email,
        ]),
      ].map(([scope, subject]) =>
        createHmac("sha256", process.env.JWT_SECRET!)
          .update(scope + ":" + subject)
          .digest("hex"),
      );
      await prisma.authRateLimit.deleteMany({ where: { id: { in: keys } } });
    }
    await app?.close();
  }, 60_000);

  it("does not allow unauthenticated owner registration", async () => {
    await api.post("/auth/register").send({}).expect(401);
  });

  it("normalizes email and restricts unverified login tokens", async () => {
    const login = await api
      .post("/auth/login")
      .send({ email: " " + ownerEmail.toUpperCase() + " ", password })
      .expect(201);
    expect(body(login).next).toBe("otp");
    expect(body(login).accessToken).toBeUndefined();
    setupToken = body(login).setupToken;
    await api
      .get("/auth/me")
      .set("Authorization", "Bearer " + setupToken)
      .expect(401);
    await api
      .post("/auth/set-password")
      .send({ token: setupToken, password: "NewPassword123" })
      .expect(401);
  });

  it("limits resend, rejects wrong codes, and consumes verification once under concurrency", async () => {
    await api.post("/auth/send-otp").send({ token: setupToken }).expect(429);
    const validCode = code(ownerEmail);
    const wrongCode = validCode === "111111" ? "222222" : "111111";
    await api
      .post("/auth/verify-otp")
      .send({ token: setupToken, code: wrongCode })
      .expect(400);
    const results = await Promise.all(
      [1, 2].map(() =>
        api
          .post("/auth/verify-otp")
          .send({ token: setupToken, code: validCode }),
      ),
    );
    expect(results.map((result) => result.status).sort()).toEqual([201, 400]);
    ownerToken = body(
      results.find((result) => result.status === 201)!,
    ).accessToken;
    const me = await api
      .get("/auth/me")
      .set("Authorization", "Bearer " + ownerToken)
      .expect(200);
    expect(body(me).role).toBe("owner");
  });

  it("requires practitioner password setup after OTP and enforces password criteria", async () => {
    const login = await api
      .post("/auth/login")
      .send({ email: staffEmail, password })
      .expect(201);
    const verify = await api
      .post("/auth/verify-otp")
      .send({ token: body(login).setupToken, code: code(staffEmail) })
      .expect(201);
    expect(body(verify).next).toBe("set_password");
    expect(body(verify).accessToken).toBeUndefined();
    await api
      .post("/auth/set-password")
      .send({ token: body(verify).setupToken, password: "short" })
      .expect(400);
    const result = await api
      .post("/auth/set-password")
      .send({ token: body(verify).setupToken, password: "Practitioner123" })
      .expect(201);
    expect(body(result).next).toBe("ready");
    await api
      .post("/auth/set-password")
      .send({ token: body(verify).setupToken, password: "ReplayPass123" })
      .expect(401);
    const loginAgain = await api
      .post("/auth/login")
      .send({ email: staffEmail, password: "Practitioner123" })
      .expect(201);
    expect(body(loginAgain).next).toBe("ready");
  });

  it("returns the same recovery contract for known and unknown addresses", async () => {
    await clearSends(ownerEmail);
    const known = await api
      .post("/auth/forgot-password")
      .send({ email: ownerEmail })
      .expect(201);
    const unknown = await api
      .post("/auth/forgot-password")
      .send({ email: unknownEmail })
      .expect(201);
    expect(Object.keys(body(known)).sort()).toEqual(
      Object.keys(body(unknown)).sort(),
    );
    expect(sent.has(unknownEmail)).toBe(false);
    const tokens = app.get(TokenService);
    expect(tokens.verify(body(known).recoveryToken, ["recovery"]).sub).not.toBe(
      ownerId,
    );
    const verified = await api
      .post("/auth/verify-otp")
      .send({ token: body(known).recoveryToken, code: code(ownerEmail) })
      .expect(201);
    expect(body(verified).next).toBe("reset_password");
    resetToken = body(verified).resetToken;
    await api
      .get("/auth/me")
      .set("Authorization", "Bearer " + resetToken)
      .expect(401);
    await api
      .post("/auth/set-password")
      .send({ token: resetToken, password: "WrongPurpose123" })
      .expect(401);
  });

  it("commits only one concurrent reset and invalidates existing access", async () => {
    const results = await Promise.all(
      [1, 2].map(() =>
        api
          .post("/auth/reset-password")
          .send({ token: resetToken, password: "ResetPassword123" }),
      ),
    );
    expect(results.map((result) => result.status).sort()).toEqual([201, 401]);
    await api
      .get("/auth/me")
      .set("Authorization", "Bearer " + ownerToken)
      .expect(401);
    await api
      .post("/auth/login")
      .send({ email: ownerEmail, password })
      .expect(401);
    const login = await api
      .post("/auth/login")
      .send({ email: ownerEmail, password: "ResetPassword123" })
      .expect(201);
    expect(body(login).next).toBe("ready");
    ownerToken = body(login).accessToken;
  });

  it("rejects inactive clinic memberships even with a previously valid token", async () => {
    await prisma.clinicUser.updateMany({
      where: { userId: ownerId },
      data: { isActive: false },
    });
    await api
      .get("/auth/me")
      .set("Authorization", "Bearer " + ownerToken)
      .expect(401);
    await api
      .post("/auth/login")
      .send({ email: ownerEmail, password: "ResetPassword123" })
      .expect(403);
    await prisma.clinicUser.updateMany({
      where: { userId: ownerId },
      data: { isActive: true },
    });
  });

  it("expires OTPs and stops after five incorrect attempts", async () => {
    await clearSends(ownerEmail);
    const recovery = await api
      .post("/auth/forgot-password")
      .send({ email: ownerEmail })
      .expect(201);
    const validCode = code(ownerEmail);
    for (let index = 0; index < 5; index++) {
      await api
        .post("/auth/verify-otp")
        .send({
          token: body(recovery).recoveryToken,
          code: validCode === "111111" ? "222222" : "111111",
        })
        .expect(400);
    }
    await api
      .post("/auth/verify-otp")
      .send({ token: body(recovery).recoveryToken, code: validCode })
      .expect(400);
    await clearSends(ownerEmail);
    const next = await api
      .post("/auth/forgot-password")
      .send({ email: ownerEmail })
      .expect(201);
    await prisma.authOtpChallenge.updateMany({
      where: { email: ownerEmail },
      data: { expiresAt: new Date(0) },
    });
    await api
      .post("/auth/verify-otp")
      .send({ token: body(next).recoveryToken, code: code(ownerEmail) })
      .expect(400);
  });

  it("enforces shared rate limits atomically across concurrent requests", async () => {
    const limits = app.get(RateLimitService);
    const results = await Promise.allSettled(
      Array.from({ length: 12 }, () =>
        limits.consume("integration", run, 5, 60),
      ),
    );
    expect(
      results.filter((result) => result.status === "fulfilled"),
    ).toHaveLength(5);
  });

  it("keeps recovery generic on delivery failure and invalidates the undelivered code", async () => {
    await clearSends(ownerEmail);
    failDelivery = true;
    await api
      .post("/auth/forgot-password")
      .send({ email: ownerEmail })
      .expect(201);
    expect(
      await prisma.authOtpChallenge.count({
        where: { email: ownerEmail, usedAt: null },
      }),
    ).toBe(0);
  });
});
