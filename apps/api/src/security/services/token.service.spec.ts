import { JwtService } from "@nestjs/jwt";
import { TokenService } from "./token.service";
import { AUTH_AUDIENCE, AUTH_ISSUER } from "../security.constants";
import { passwordRequirements } from "@clinic/types";

describe("Security contracts", () => {
  const before = { ...process.env };
  const secret = "synthetic-security-test-secret";
  beforeEach(() => {
    process.env.JWT_SECRET = secret;
    delete process.env.AUTH_FIXED_OTP;
  });
  afterAll(() => {
    process.env = before;
  });

  it("enforces purpose and expiry", () => {
    const jwt = new JwtService({ secret });
    const service = new TokenService(jwt);
    const setup = service.sign({
      sub: "user",
      purpose: "setup",
      passwordVersion: 0,
    });
    expect(() => service.verify(setup, ["access"])).toThrow();
    expect(service.verify(setup, ["setup"]).purpose).toBe("setup");
    const expired = jwt.sign(
      { sub: "user", purpose: "access", passwordVersion: 0 },
      { expiresIn: -1, issuer: AUTH_ISSUER, audience: AUTH_AUDIENCE },
    );
    expect(() => service.verify(expired, ["access"])).toThrow();
    const legacy = jwt.sign({ sub: "user", clinicId: "clinic" });
    expect(() => service.verify(legacy, ["access"])).toThrow();
  });

  it("refuses fixed OTPs in production", () => {
    process.env.NODE_ENV = "production";
    process.env.AUTH_FIXED_OTP = "000000";
    expect(() => new TokenService(new JwtService({ secret }))).toThrow(
      "forbidden in production",
    );
    process.env.NODE_ENV = "test";
  });

  it("allows simple bilingual passwords and rejects bcrypt truncation", () => {
    expect(
      Object.values(passwordRequirements("عيادتي123")).every(Boolean),
    ).toBe(true);
    expect(Object.values(passwordRequirements("password")).every(Boolean)).toBe(
      false,
    );
    expect(Object.values(passwordRequirements("12345678")).every(Boolean)).toBe(
      false,
    );
    expect(
      Object.values(passwordRequirements("ك".repeat(40) + "123")).every(
        Boolean,
      ),
    ).toBe(false);
  });
});
