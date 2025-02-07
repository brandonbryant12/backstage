// accessCheckers.test.ts

import { accessCheckerRegistry } from './accessCheckers';
import { Entity } from '@backstage/catalog-model';
import { JwtToken, CheckerContext } from './accessCheckers';

describe('accessCheckerRegistry', () => {
  describe('owner checker', () => {
    const entity: Entity = {
      apiVersion: 'backstage.io/v1alpha1',
      kind: 'Component',
      metadata: {
        name: 'test-entity',
      },
    };

    it('should return true if isOwnedEntity returns true', () => {
      const context: CheckerContext = {
        isOwnedEntity: () => true,
      };
      const token: JwtToken = { sub: 'myuser' }; // Not used for owner check

      const result = accessCheckerRegistry.owner.check(entity, token, context);
      expect(result).toBe(true);
    });

    it('should return false if isOwnedEntity returns false', () => {
      const context: CheckerContext = {
        isOwnedEntity: () => false,
      };
      const token: JwtToken = { sub: 'myuser' };

      const result = accessCheckerRegistry.owner.check(entity, token, context);
      expect(result).toBe(false);
    });
  });

  describe('ADGroup checker', () => {
    const baseEntity: Entity = {
      apiVersion: 'backstage.io/v1alpha1',
      kind: 'Component',
      metadata: {
        name: 'test-entity',
      },
    };

    it('should return false if no annotation is present', () => {
      const token: JwtToken = { sub: 'myuser', groups: ['SomeGroup'] };
      const result = accessCheckerRegistry.ADGroup.check(baseEntity, token, {
        isOwnedEntity: jest.fn(),
      });
      expect(result).toBe(false);
    });

    it('should return false if user has no groups', () => {
      const entityWithAnnotation = {
        ...baseEntity,
        metadata: {
          ...baseEntity.metadata,
          annotations: {
            MicrosoftADGroups: 'DevTeam, QAGroup',
          },
        },
      };
      const token: JwtToken = { sub: 'myuser' };
      const result = accessCheckerRegistry.ADGroup.check(entityWithAnnotation, token, {
        isOwnedEntity: jest.fn(),
      });
      expect(result).toBe(false);
    });

    it('should return true if user groups intersect with annotation groups', () => {
      const entityWithAnnotation = {
        ...baseEntity,
        metadata: {
          ...baseEntity.metadata,
          annotations: {
            MicrosoftADGroups: 'DevTeam, QAGroup',
          },
        },
      };
      const token: JwtToken = {
        sub: 'myuser',
        groups: ['QAGroup', 'AnotherGroup'],
      };
      const result = accessCheckerRegistry.ADGroup.check(entityWithAnnotation, token, {
        isOwnedEntity: jest.fn(),
      });
      expect(result).toBe(true);
    });

    it('should return false if user groups do not intersect', () => {
      const entityWithAnnotation = {
        ...baseEntity,
        metadata: {
          ...baseEntity.metadata,
          annotations: {
            MicrosoftADGroups: 'DevTeam, QAGroup',
          },
        },
      };
      const token: JwtToken = {
        sub: 'myuser',
        groups: ['Marketing', 'Sales'],
      };
      const result = accessCheckerRegistry.ADGroup.check(entityWithAnnotation, token, {
        isOwnedEntity: jest.fn(),
      });
      expect(result).toBe(false);
    });
  });

  describe('serviceNowContact checker', () => {
    const baseEntity: Entity = {
      apiVersion: 'backstage.io/v1alpha1',
      kind: 'Component',
      metadata: { name: 'test' },
    };

    it('should return false if there are no serviceNowContact relations', () => {
      const token: JwtToken = { sub: 'myuser' };
      const result = accessCheckerRegistry.serviceNowContact.check(baseEntity, token, {
        isOwnedEntity: jest.fn(),
      });
      expect(result).toBe(false);
    });

    it('should return false if serviceNowContact does not match the token.sub user', () => {
      const entityWithRelations = {
        ...baseEntity,
        relations: [{ type: 'serviceNowContact', targetRef: 'user:default/someotheruser' }],
      };
      const token: JwtToken = { sub: 'myuser' };
      const result = accessCheckerRegistry.serviceNowContact.check(entityWithRelations, token, {
        isOwnedEntity: jest.fn(),
      });
      expect(result).toBe(false);
    });

    it('should return true if any serviceNowContact relation matches token.sub', () => {
      const entityWithRelations = {
        ...baseEntity,
        relations: [
          { type: 'serviceNowContact', targetRef: 'user:default/myuser' },
          { type: 'serviceNowContact', targetRef: 'user:default/anotheruser' },
        ],
      };
      const token: JwtToken = { sub: 'myuser' };
      const result = accessCheckerRegistry.serviceNowContact.check(entityWithRelations, token, {
        isOwnedEntity: jest.fn(),
      });
      expect(result).toBe(true);
    });
  });
});
