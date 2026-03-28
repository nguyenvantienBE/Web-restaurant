import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { RealtimeEvents, RealtimeRooms } from './realtime.events';

const frontendOrigins = [
  ...(process.env.FRONTEND_URL || 'http://localhost:3001')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
  'http://localhost:3001',
  'http://localhost:5173',
  'http://127.0.0.1:3001',
].filter((v, i, a) => v && a.indexOf(v) === i);

@WebSocketGateway({
  cors: {
    origin: frontendOrigins,
    credentials: true,
  },
})
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger = new Logger('RealtimeGateway');

  constructor(
    private jwtService: JwtService,
    private config: ConfigService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth.token || client.handshake.headers.authorization?.split(' ')[1];

      if (!token) {
        this.logger.warn(`Client ${client.id} connected without token`);
        return;
      }

      const payload = this.jwtService.verify(token, {
        secret: this.config.get('jwt.secret'),
      });

      // Attach user to socket
      (client as any).user = payload;

      // Auto-join rooms based on role
      const role = payload.role;
      if (role === 'Cashier') {
        client.join(RealtimeRooms.CASHIER);
        this.logger.log(`Client ${client.id} (${payload.email}) joined CASHIER room`);
      } else if (role === 'Kitchen') {
        client.join(RealtimeRooms.KITCHEN);
        this.logger.log(`Client ${client.id} (${payload.email}) joined KITCHEN room`);
      } else if (role === 'Manager' || role === 'Admin') {
        client.join(RealtimeRooms.MANAGER);
        client.join(RealtimeRooms.CASHIER);
        client.join(RealtimeRooms.KITCHEN);
        this.logger.log(`Client ${client.id} (${payload.email}) joined ALL rooms`);
      }

      this.logger.log(`Client connected: ${client.id} (${payload.email})`);
    } catch (error) {
      this.logger.error(`Connection error: ${error.message}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const user = (client as any).user;
    this.logger.log(`Client disconnected: ${client.id} ${user ? `(${user.email})` : ''}`);
  }

  // Emit order events
  emitOrderNew(order: any) {
    this.logger.log(`Emitting ORDER_NEW for order ${order.orderNumber}`);
    this.server.to(RealtimeRooms.CASHIER).emit(RealtimeEvents.ORDER_NEW, order);
  }

  emitOrderConfirmed(order: any) {
    this.logger.log(`Emitting KITCHEN_TICKET for order ${order.orderNumber}`);
    this.server.to(RealtimeRooms.KITCHEN).emit(RealtimeEvents.KITCHEN_TICKET, order);
    // Thu ngân / quản lý (room CASHIER): refetch danh sách đơn khi đơn chuyển CONFIRMED (vd. mang về sau xác nhận)
    this.server.to(RealtimeRooms.CASHIER).emit(RealtimeEvents.ORDER_UPDATED, order);
  }

  emitOrderUpdated(order: any) {
    this.logger.log(`Emitting ORDER_UPDATED for order ${order.orderNumber}`);
    this.server.to(RealtimeRooms.CASHIER).emit(RealtimeEvents.ORDER_UPDATED, order);
  }

  emitOrderCancelled(order: any) {
    this.logger.log(`Emitting ORDER_CANCELLED for order ${order.orderNumber}`);
    this.server.to(RealtimeRooms.CASHIER).emit(RealtimeEvents.ORDER_CANCELLED, order);
    this.server.to(RealtimeRooms.KITCHEN).emit(RealtimeEvents.ORDER_CANCELLED, order);
  }

  // Emit item status changes
  emitItemStatusChanged(item: any) {
    this.logger.log(`Emitting ITEM_STATUS_CHANGED for item ${item.id}`);
    this.server.to(RealtimeRooms.CASHIER).emit(RealtimeEvents.ITEM_STATUS_CHANGED, item);
    this.server.to(RealtimeRooms.KITCHEN).emit(RealtimeEvents.ITEM_STATUS_CHANGED, item);
  }

  // Emit table status changes
  emitTableStatusChanged(table: any) {
    this.logger.log(`Emitting TABLE_STATUS_CHANGED for table ${table.tableCode}`);
    this.server.emit(RealtimeEvents.TABLE_STATUS_CHANGED, table);
  }

  // Emit staff calls
  emitStaffCall(staffCall: any) {
    this.logger.log(`Emitting STAFF_CALL from table ${staffCall.order?.session?.table?.tableCode}`);
    this.server.to(RealtimeRooms.CASHIER).emit(RealtimeEvents.STAFF_CALL, staffCall);
  }

  // Emit payment completed
  emitPaymentCompleted(payment: any) {
    this.logger.log(`Emitting PAYMENT_COMPLETED for payment ${payment.id}`);
    this.server.to(RealtimeRooms.CASHIER).emit(RealtimeEvents.PAYMENT_COMPLETED, payment);
    this.server.to(RealtimeRooms.KITCHEN).emit(RealtimeEvents.PAYMENT_COMPLETED, payment);
  }

  emitReservationNew(payload: {
    id: string;
    confirmationCode: string;
    customerName: string;
    reservationTime: string;
  }) {
    this.logger.log(`Emitting RESERVATION_NEW ${payload.confirmationCode}`);
    this.server.to(RealtimeRooms.STAFF).emit(RealtimeEvents.RESERVATION_NEW, payload);
    this.server.to(RealtimeRooms.CASHIER).emit(RealtimeEvents.RESERVATION_NEW, payload);
  }

  emitReservationUpdated(payload: {
    id: string;
    status: string;
    confirmationCode: string;
  }) {
    this.server.to(RealtimeRooms.STAFF).emit(RealtimeEvents.RESERVATION_UPDATED, payload);
    this.server.to(RealtimeRooms.CASHIER).emit(RealtimeEvents.RESERVATION_UPDATED, payload);
  }
}
