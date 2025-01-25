import { Pipe, PipeTransform } from '@angular/core';
import { shortenName } from '../utils/support.utils';

@Pipe({
  name: 'shortName',
  standalone: true
})
export class ShortNamePipe implements PipeTransform {

  transform(value: string): string {
    return shortenName(value);
  }

}
