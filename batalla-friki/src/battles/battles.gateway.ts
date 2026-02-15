import { WebSocketGateway, SubscribeMessage, MessageBody } from '@nestjs/websockets';
import { BattlesService } from './battles.service';
import { CreateBattleDto } from './dto/create-battle.dto';
import { UpdateBattleDto } from './dto/update-battle.dto';

@WebSocketGateway()
export class BattlesGateway {
  constructor(private readonly battlesService: BattlesService) {}

  @SubscribeMessage('createBattle')
  create(@MessageBody() createBattleDto: CreateBattleDto) {
    return this.battlesService.create(createBattleDto);
  }

  @SubscribeMessage('findAllBattles')
  findAll() {
    return this.battlesService.findAll();
  }

  @SubscribeMessage('findOneBattle')
  findOne(@MessageBody() id: number) {
    return this.battlesService.findOne(id);
  }

  @SubscribeMessage('updateBattle')
  update(@MessageBody() updateBattleDto: UpdateBattleDto) {
    return this.battlesService.update(updateBattleDto.id, updateBattleDto);
  }

  @SubscribeMessage('removeBattle')
  remove(@MessageBody() id: number) {
    return this.battlesService.remove(id);
  }
}
