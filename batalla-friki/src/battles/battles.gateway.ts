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
import { PrismaService } from 'src/prisma/prisma.service';

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

  constructor(
    private readonly battlesService: BattlesService,
    private readonly prisma: PrismaService,
  ) {}

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
    console.log(
      `Jugador ${data.userId} busca partida con Personaje ${data.characterId}...`,
    );

    const user = await this.prisma.user.findUnique({
      where: { id: data.userId },
    });
    const character = await this.prisma.character.findUnique({
      where: { id: data.characterId },
    });

    if (!user || !character) {
      client.emit(
        'matchmaking-status',
        ' Error: Usuario o Personaje no encontrado.',
      );
      return;
    }

    if (user.level < character.minLevel) {
      client.emit(
        'matchmaking-status',
        ` Nivel insuficiente. Necesitas nivel ${character.minLevel} para usar a ${character.name}.`,
      );
      return;
    }

    const alreadyInQueue = this.matchmakingQueue.find(
      (p) => p.userId === data.userId,
    );
    if (alreadyInQueue) {
      client.emit('matchmaking-status', 'Ya estás en la cola...');
      return;
    }

    this.matchmakingQueue.push({
      socket: client,
      userId: data.userId,
      characterId: data.characterId,
    });

    client.emit('matchmaking-status', 'Buscando oponente... 🕒');
    console.log(`Jugadores en cola: ${this.matchmakingQueue.length}`);

    if (this.matchmakingQueue.length >= 2) {
      const player1 = this.matchmakingQueue.shift();
      const player2 = this.matchmakingQueue.shift();

      if (player1 && player2) {
        console.log(
          `Intentando crear Match! ${player1.userId} vs ${player2.userId}`,
        );

        try {
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
          console.log(`Batalla ${battle.id} creada con éxito`);
        } catch (error) {
          console.error('Error creando batalla:', error.message);

          player1.socket.emit(
            'matchmaking-status',
            'Error al crear batalla. Inténtalo de nuevo.',
          );
          player2.socket.emit(
            'matchmaking-status',
            'Error al crear batalla. Inténtalo de nuevo.',
          );
        }
      }
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

  @SubscribeMessage('create-pve-battle')
  async handleCreatePve(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userId: number; characterId: number },
  ) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: data.userId },
      });
      const char = await this.prisma.character.findUnique({
        where: { id: data.characterId },
      });

      if (user.level < char.minLevel) {
        client.emit(
          'matchmaking-status',
          `🔒 Nivel insuficiente para ${char.name}.`,
        );
        return;
      }

      const battle = await this.battlesService.createPve({
        playerId: data.userId,
        playerCharId: data.characterId,
      });

      const roomId = `battle-${battle.id}`;
      client.join(roomId);

      client.emit('battle-created', battle);
    } catch (e) {
      console.error(e);
      client.emit('matchmaking-status', 'Error creando partida vs CPU');
    }
  }

  @SubscribeMessage('attack')
  async handleAttack(
    @MessageBody() data: { battleId: number; userId: number },
  ) {
    try {
      let battle = await this.battlesService.processTurn(
        data.battleId,
        data.userId,
      );
      this.broadcastUpdate(data.battleId, battle);

      if (battle.status === 'IN_PROGRESS' && battle.mode === 'PVE') {
        setTimeout(async () => {
          try {
            const botUserId = battle.player2.userId;
            const battleAfterBot = await this.battlesService.processTurn(
              data.battleId,
              botUserId,
            );
            this.broadcastUpdate(data.battleId, battleAfterBot);
          } catch (err) {
            console.error('Error en turno de Bot:', err);
          }
        }, 1500);
      }
    } catch (error) {
      console.error('Error en ataque:', error.message);
    }
  }

  private broadcastUpdate(battleId: number, battle: any) {
    const roomId = `battle-${battleId}`;
    if (battle.status === 'FINISHED') {
      this.server
        .to(roomId)
        .emit('battle-finished', { winner: battle.winnerUserId, battle });
    } else {
      this.server.to(roomId).emit('turn-update', battle);
    }
  }
}
