import { helloworldPlugin } from './plugin';

describe('helloworld', () => {
  it('should export plugin', () => {
    expect(helloworldPlugin).toBeDefined();
  });
});
