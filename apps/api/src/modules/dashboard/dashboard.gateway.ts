import { Injectable } from "@nestjs/common";
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";

@Injectable()
@WebSocketGateway({
  cors: {
    origin: ["http://localhost:3000", "http://192.168.8.116:3000"],
    credentials: true,
  },
})
export class DashboardGateway {
  @WebSocketServer()
  server: Server;

  @SubscribeMessage("join-clinic")
  handleJoinClinic(
    @MessageBody() clinicId: string,
    @ConnectedSocket() client: Socket,
  ) {
    void client.join(`clinic:${clinicId}`);
  }

  emitAppointmentChanged(clinicId: string) {
    this.server.to(`clinic:${clinicId}`).emit("appointment-changed");
  }

  emitReferralChanged(clinicId: string) {
    this.server.to(`clinic:${clinicId}`).emit("referral-changed");
  }

  emitNotificationCreated(clinicId: string, userId: string) {
    this.server
      .to(`clinic:${clinicId}`)
      .emit("notification-created", { userId });
  }
}
