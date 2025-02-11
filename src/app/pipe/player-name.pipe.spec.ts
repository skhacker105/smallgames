import { PlayerNamePipe } from './player-name.pipe';

describe('PlayerNamePipe', () => {
  it('create an instance', () => {
    const pipe = new PlayerNamePipe();
    expect(pipe).toBeTruthy();
  });
});
