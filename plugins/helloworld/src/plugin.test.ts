
import { 
  helloworldPlugin,
  EntityConsumedApisCardExtension,
  EntityProvidedApisCardExtension,
  EntityDependsOnComponentsCardExtension,
  EntityDependsOnResourcesCardExtension,
  EntityHasSubcomponentsCardExtension
} from './plugin';

describe('helloworld', () => {
  it('should export plugin', () => {
    expect(helloworldPlugin).toBeDefined();
  });

  it('should export EntityConsumedApisCardExtension', () => {
    expect(EntityConsumedApisCardExtension).toBeDefined();
  });

  it('should export EntityProvidedApisCardExtension', () => {
    expect(EntityProvidedApisCardExtension).toBeDefined();
  });

  it('should export EntityDependsOnComponentsCardExtension', () => {
    expect(EntityDependsOnComponentsCardExtension).toBeDefined();
  });

  it('should export EntityDependsOnResourcesCardExtension', () => {
    expect(EntityDependsOnResourcesCardExtension).toBeDefined();
  });

  it('should export EntityHasSubcomponentsCardExtension', () => {
    expect(EntityHasSubcomponentsCardExtension).toBeDefined();
  });
});
      