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

@Injectable()
@WebSocketGateway({
  cors: {
    origin: corsOrigin,
    credentials: true,
  },
})
export class DashboardGateway {
  private readonly log = createLogger(DashboardGateway.name);

  @WebSocketServer()
  server: Server;

  @SubscribeMessage("join-clinic")
  handleJoinClinic(
    @MessageBody() clinicId: string,
    @ConnectedSocket() client: Socket,
  ) {
    void client.join(`clinic:${clinicId}`);
    this.log.debug("join_clinic", { clinicId, clientId: client.id });
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
