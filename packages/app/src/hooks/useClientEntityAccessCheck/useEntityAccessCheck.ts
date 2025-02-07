// useEntityAccessCheck.ts

import { useState, useEffect } from 'react';
import { useEntity, useEntityOwnership } from '@backstage/plugin-catalog-react';
import { identityApiRef, useApi } from '@backstage/core-plugin-api';
import { jwtDecode } from 'jwt-decode';

import {
  AccessCondition,
  accessCheckerRegistry,
  JwtToken,
  CheckerContext,
} from './accessCheckers';

interface AccessState {
  loading: boolean;
  hasAccess: boolean;
}

/** Utility: check if a JWT is expired. */
function isTokenExpired(token: JwtToken): boolean {
  if (!token.exp) return false;
  // exp is in seconds, while Date.now() is in ms
  return Date.now() >= token.exp * 1000;
}

/**
 * A hook that checks if the current user has access to the given entity,
 * according to one or more "conditions" (owner, ADGroup, serviceNowContact).
 *
 * @param conditions (optional) an array of conditions to check. If ANY pass, user has access.
 *                   defaults to `['owner']` if none provided.
 */
export function useEntityAccessCheck(
  conditions: AccessCondition[] = ['owner'],
): AccessState {
  const { entity } = useEntity();
  const { loading: ownershipLoading, isOwnedEntity } = useEntityOwnership();
  const identityApi = useApi(identityApiRef);

  const [state, setState] = useState<AccessState>({
    loading: true,
    hasAccess: false,
  });

  useEffect(() => {
    let didCancel = false;

    async function checkAccess() {
      // If the entity is not defined, automatically fail
      if (!entity) {
        if (!didCancel) {
          setState({ loading: false, hasAccess: false });
        }
        return;
      }

      // Attempt to get the user token from identity API
      let tokenString: string | undefined = undefined;
      try {
        const creds = await identityApi.getCredentials();
        tokenString = creds.token || undefined;
      } catch {
        if (!didCancel) {
          setState({ loading: false, hasAccess: false });
        }
        return;
      }

      // If there's no token, fail
      if (!tokenString) {
        if (!didCancel) {
          setState({ loading: false, hasAccess: false });
        }
        return;
      }

      // Decode the token
      let decoded: JwtToken;
      try {
        decoded = jwtDecode<JwtToken>(tokenString);
      } catch {
        if (!didCancel) {
          setState({ loading: false, hasAccess: false });
        }
        return;
      }

      // Check expiration
      if (isTokenExpired(decoded)) {
        if (!didCancel) {
          setState({ loading: false, hasAccess: false });
        }
        return;
      }

      // Build a context that checkers might need
      const context: CheckerContext = { isOwnedEntity };

      // Evaluate each condition
      const checks = conditions.map(cond => {
        const checker = accessCheckerRegistry[cond];
        if (!checker) {
          // If there's no checker for that condition, it fails that condition
          return Promise.resolve(false);
        }
        return Promise.resolve(checker.check(entity, decoded, context));
      });

      try {
        const results = await Promise.all(checks);
        // If ANY are true => user has access
        const hasAccess = results.some(r => r === true);
        if (!didCancel) {
          setState({ loading: false, hasAccess });
        }
      } catch {
        // If something threw, treat it as a failure
        if (!didCancel) {
          setState({ loading: false, hasAccess: false });
        }
      }
    }

    checkAccess();

    return () => {
      didCancel = true;
    };
  }, [entity, conditions, identityApi, isOwnedEntity]);

  // Combine the local state.loading with the ownershipLoading
  return {
    loading: ownershipLoading || state.loading,
    hasAccess: state.hasAccess,
  };
}
