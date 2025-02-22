import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'secondsToHMS',
  standalone: true,
  pure: true
})
export class SecondsToHMSPipe implements PipeTransform {

  transform(seconds: number, hideIfZero: boolean = false): string {
    if (isNaN(seconds)) {
      return '';
    }

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    let labelText = ' s';

    let formattedTime = '';

    if (hours > 0 || !hideIfZero) {
      formattedTime += this.pad(hours) + ':';
      labelText = ' h';
    }

    if (minutes > 0 || !hideIfZero || hours > 0) {
      formattedTime += this.pad(minutes) + ':';
      if(labelText === ' s')  labelText = ' m';
    }

    formattedTime += this.pad(secs);

    return formattedTime + labelText;
  }

  private pad(num: number): string {
    return num < 10 ? `0${num}` : `${num}`;
  }

}
