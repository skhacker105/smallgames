import { SecondsToHMSPipe } from './seconds-to-hms.pipe';

describe('SecondsToHMSPipe', () => {
  it('create an instance', () => {
    const pipe = new SecondsToHMSPipe();
    expect(pipe).toBeTruthy();
  });
});
