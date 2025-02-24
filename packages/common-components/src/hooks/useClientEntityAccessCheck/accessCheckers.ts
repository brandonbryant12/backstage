import { Entity } from '@backstage/catalog-model';

/**
 * The possible access conditions supported by our system.
 */
export type AccessCondition = 'owner' | 'serviceNowContact' | 'ADGroup';

/**
 * Minimal shape of a JWT token we’re expecting.
 */
export interface JwtToken {
  sub: string;
  groups?: string[];
  exp?: number;
}

/**
 * Context passed to each checker.
 */
export interface CheckerContext {
  isOwnedEntity: (entity: Entity) => boolean;
}

interface AccessChecker {
  check(entity: Entity, token: JwtToken, context: CheckerContext): boolean | Promise<boolean>;
}

/** Utility: parse user:default/username into username. */
function parseUsernameFromRef(ref: string): string {
  const parts = ref.split('/');
  return parts[parts.length - 1];
}

const ownerChecker: AccessChecker = {
  check: (entity, _token, context) => {
    return context.isOwnedEntity(entity);
  },
};

const adGroupChecker: AccessChecker = {
  check: (entity, token) => {
    const annotation = entity?.metadata?.annotations?.MicrosoftADGroups;
    if (!annotation || !token.groups) {
      return false;
    }
    const entityGroups = annotation.split(',').map(g => g.trim()).filter(Boolean);
    const userGroups = new Set(token.groups);
    return entityGroups.some(g => userGroups.has(g));
  },
};

const serviceNowContactChecker: AccessChecker = {
  check: (entity, token) => {
    const relations = entity?.relations?.filter(r => r.type === 'serviceNowContact') ?? [];
    return relations.some(rel => parseUsernameFromRef(rel.targetRef) === token.sub);
  },
};

export const accessCheckerRegistry: Record<AccessCondition, AccessChecker> = {
  owner: ownerChecker,
  ADGroup: adGroupChecker,
  serviceNowContact: serviceNowContactChecker,
};