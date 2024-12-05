import { sandboxPlugin } from './plugin';

describe('sandbox', () => {
  it('should export plugin', () => {
    expect(sandboxPlugin).toBeDefined();
  });
});
