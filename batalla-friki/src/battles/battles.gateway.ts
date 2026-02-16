import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { BattlesService } from './battles.service';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ cors: { origin: '*' } })
export class BattlesGateway {
  @WebSocketServer()
  server!: Server;

  constructor(private readonly battlesService: BattlesService) {}

  @SubscribeMessage('create-battle')
  async createBattle(
    @MessageBody()
    data: {
      player1Id: number;
      player1CharId: number;
      player2Id: number;
      player2CharId: number;
    },
    @ConnectedSocket() client: Socket,
  ) {
    const battle = await this.battlesService.createBattle(
      data.player1Id,
      data.player1CharId,
      data.player2Id,
      data.player2CharId,
      client.id,
    );

    client.join(battle.id);
    client.emit('battle-created', battle);
  }

  @SubscribeMessage('join-battle')
  joinBattle(
    @MessageBody() data: { battleId: string; userId: number },
    @ConnectedSocket() client: Socket,
  ) {
    const battle = this.battlesService.joinBattle(
      data.battleId,
      data.userId,
      client.id,
    );

    client.join(battle.id);

    this.server.to(battle.id).emit('user-joined', battle);
  }

  @SubscribeMessage('attack')
  async attack(@MessageBody() data: { battleId: string; userId: number }) {
    try {
      const result = await this.battlesService.attack(
        data.battleId,
        data.userId,
      );

      if (result.status === 'finished') {
        this.server.to(data.battleId).emit('battle-finished', result);
      } else {
        this.server.to(data.battleId).emit('turn-update', result.battle);
      }
    } catch (error) {
      console.error(error.message);
    }
  }
}
