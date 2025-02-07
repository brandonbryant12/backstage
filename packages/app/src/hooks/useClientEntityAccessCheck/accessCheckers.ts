// accessCheckers.ts

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
  exp?: number; // Expiration time in seconds since the epoch
}

/**
 * Context passed to each checker. Could include anything that checkers need,
 * such as ownership checks, feature flags, additional user data, etc.
 */
export interface CheckerContext {
  /**
   * Provided by the @backstage/plugin-catalog-react "useEntityOwnership" hook.
   * Tells us if the current identity is an owner of the entity.
   */
  isOwnedEntity: (entity: Entity) => boolean;
}

/**
 * Each AccessChecker is an object with a single `check` method.
 * You can expand this signature if you ever need more advanced usage.
 */
interface AccessChecker {
  check(entity: Entity, token: JwtToken, context: CheckerContext): boolean | Promise<boolean>;
}

/** Utility: parse user:default/username into username. */
function parseUsernameFromRef(ref: string): string {
  const parts = ref.split('/');
  return parts[parts.length - 1];
}

/** The “owner” checker. Relies on `context.isOwnedEntity` to decide. */
const ownerChecker: AccessChecker = {
  check: (entity, _token, context) => {
    return context.isOwnedEntity(entity);
  },
};

/** The “ADGroup” checker. Looks up "MicrosoftADGroups" annotation and sees if the user is in any of them. */
const adGroupChecker: AccessChecker = {
  check: (entity, token) => {
    const annotation = entity?.metadata?.annotations?.MicrosoftADGroups;
    if (!annotation || !token.groups) {
      return false;
    }
    const entityGroups = annotation.split(',').map(g => g.trim()).filter(Boolean);
    // Convert user groups to a set for quick lookup
    const userGroups = new Set(token.groups);
    return entityGroups.some(g => userGroups.has(g));
  },
};

/** 
 * The “serviceNowContact” checker. 
 * We assume your entity has relations of type "serviceNowContact", e.g.: 
 *   { type: 'serviceNowContact', targetRef: 'user:default/myuser' }.
 */
const serviceNowContactChecker: AccessChecker = {
  check: (entity, token) => {
    const relations = entity?.relations?.filter(r => r.type === 'serviceNowContact') ?? [];
    return relations.some(rel => parseUsernameFromRef(rel.targetRef) === token.sub);
  },
};

/**
 * Registry of all known checkers. 
 * 
 * We map each AccessCondition to an AccessChecker.
 */
export const accessCheckerRegistry: Record<AccessCondition, AccessChecker> = {
  owner: ownerChecker,
  ADGroup: adGroupChecker,
  serviceNowContact: serviceNowContactChecker,
};
