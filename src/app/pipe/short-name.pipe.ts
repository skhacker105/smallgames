import { Pipe, PipeTransform } from '@angular/core';
import { shortenName } from '../utils/support.utils';

@Pipe({
  name: 'shortName'
})
export class ShortNamePipe implements PipeTransform {

  transform(value: string): string {
    return shortenName(value);
  }

}
