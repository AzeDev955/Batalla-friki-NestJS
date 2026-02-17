import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { BattlesService } from './battles.service';

interface QueuedPlayer {
  socket: Socket;
  userId: number;
  characterId: number;
}

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class BattlesGateway implements OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private matchmakingQueue: QueuedPlayer[] = [];

  constructor(private readonly battlesService: BattlesService) {}

  handleDisconnect(client: Socket) {
    this.matchmakingQueue = this.matchmakingQueue.filter(
      (player) => player.socket.id !== client.id,
    );
    console.log(
      `Cliente desconectado: ${client.id}. Cola actual: ${this.matchmakingQueue.length}`,
    );
  }

  @SubscribeMessage('find-match')
  async handleFindMatch(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userId: number; characterId: number },
  ) {
    console.log(`Jugador ${data.userId} busca partida...`);
    const alreadyInQueue = this.matchmakingQueue.find(
      (p) => p.userId === data.userId,
    );
    if (alreadyInQueue) {
      client.emit('matchmaking-status', 'Ya estás buscando partida...');
      return;
    }

    this.matchmakingQueue.push({
      socket: client,
      userId: data.userId,
      characterId: data.characterId,
    });

    client.emit('matchmaking-status', 'Buscando oponente... 🕒');

    if (this.matchmakingQueue.length >= 2) {
      const player1 = this.matchmakingQueue.shift();
      const player2 = this.matchmakingQueue.shift();

      if (player1 && player2) {
        console.log(
          `¡Match encontrado! ${player1.userId} vs ${player2.userId}`,
        );
        const battle = await this.battlesService.create({
          player1Id: player1.userId,
          player1CharId: player1.characterId,
          player2Id: player2.userId,
          player2CharId: player2.characterId,
        });

        const roomId = `battle-${battle.id}`;
        player1.socket.join(roomId);
        player2.socket.join(roomId);

        this.server.to(roomId).emit('battle-created', battle);
      }
    }
  }

  @SubscribeMessage('attack')
  async handleAttack(
    @MessageBody() data: { battleId: number; userId: number },
  ) {
    const battle = await this.battlesService.processTurn(
      data.battleId,
      data.userId,
    );

    if (battle.status === 'FINISHED') {
      this.server.to(`battle-${data.battleId}`).emit('battle-finished', {
        winner: battle.winnerUserId,
        battle: battle,
      });
    } else {
      this.server.to(`battle-${data.battleId}`).emit('turn-update', battle);
    }
  }

  @SubscribeMessage('join-battle')
  async handleJoinBattle(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { battleId: number },
  ) {
    const roomId = `battle-${data.battleId}`;
    client.join(roomId);
    client.emit(
      'matchmaking-status',
      'Te has unido como espectador/reconectado',
    );
  }
}
