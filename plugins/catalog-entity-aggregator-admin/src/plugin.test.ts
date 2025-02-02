import { catalogEntityAggregatorAdminPlugin } from './plugin';

describe('catalogEntityAggregatorAdminPlugin', () => {
  it('should be defined', () => {
    expect(catalogEntityAggregatorAdminPlugin).toBeDefined();
    expect(catalogEntityAggregatorAdminPlugin.getId()).toBe('catalog-entity-aggregator-admin');
  });
});