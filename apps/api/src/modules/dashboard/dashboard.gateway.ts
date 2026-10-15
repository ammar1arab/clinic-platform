import { Injectable } from "@nestjs/common";
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { corsOrigin, createLogger } from "@/infrastructure";
import { JwtStrategy } from "@/modules/auth/strategies/jwt.strategy";
import { TokenService } from "@/security/services/token.service";

@Injectable()
@WebSocketGateway({
  cors: {
    origin: corsOrigin,
    credentials: true,
  },
})
export class DashboardGateway {
  private readonly log = createLogger(DashboardGateway.name);
  private readonly expiryTimers = new WeakMap<
    Socket,
    ReturnType<typeof setTimeout>
  >();

  constructor(
    private readonly tokens: TokenService,
    private readonly strategy: JwtStrategy,
  ) {}

  @WebSocketServer()
  server: Server;

  @SubscribeMessage("join-clinic")
  async handleJoinClinic(
    @MessageBody() clinicId: string,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const token: unknown = client.handshake.auth.token;
      if (typeof token !== "string") throw new Error("invalidToken");
      const payload = this.tokens.verify(token, ["access"]);
      const user = await this.strategy.validate(null, payload);
      if (clinicId !== user.clinicId) throw new Error("clinicUnavailable");
      if (!("exp" in payload) || typeof payload.exp !== "number")
        throw new Error("invalidToken");
      await client.join(`clinic:${user.clinicId}`);
      clearTimeout(this.expiryTimers.get(client));
      const timer = setTimeout(
        () => client.disconnect(true),
        Math.max(0, payload.exp * 1000 - Date.now()),
      );
      timer.unref();
      this.expiryTimers.set(client, timer);
    } catch {
      client.disconnect(true);
      return;
    }
    this.log.debug("join_clinic", { clinicId, clientId: client.id });
  }

  handleDisconnect(client: Socket) {
    clearTimeout(this.expiryTimers.get(client));
    this.expiryTimers.delete(client);
  }

  @SubscribeMessage("leave-clinic")
  async handleLeaveClinic(
    @MessageBody() clinicId: string,
    @ConnectedSocket() client: Socket,
  ) {
    if (typeof clinicId === "string") await client.leave(`clinic:${clinicId}`);
  }

  emitAppointmentChanged(clinicId: string) {
    this.server.to(`clinic:${clinicId}`).emit("appointment-changed");
    this.log.debug("emit_appointment_changed", { clinicId });
  }

  emitReferralChanged(clinicId: string) {
    this.server.to(`clinic:${clinicId}`).emit("referral-changed");
    this.log.debug("emit_referral_changed", { clinicId });
  }

  emitNotificationCreated(clinicId: string, userId: string) {
    this.server
      .to(`clinic:${clinicId}`)
      .emit("notification-created", { userId });
    this.log.debug("emit_notification_created", { clinicId, userId });
  }
}
