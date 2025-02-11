import { Pipe, PipeTransform } from '@angular/core';
import { IPlayer } from '../interfaces';
import { UserService } from '../services/user.service';

@Pipe({
  name: 'playerName',
  standalone: true
})
export class PlayerNamePipe implements PipeTransform {

  constructor(private userService: UserService){}

  transform(player: IPlayer): unknown {
    if (this.userService.me && this.userService.me.userId === player.userId) {
      return 'Me';
    } else {
      return player.name;
    }
    return null;
  }

}
