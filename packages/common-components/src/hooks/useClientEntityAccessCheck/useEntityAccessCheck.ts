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

function isTokenExpired(token: JwtToken): boolean {
  if (!token.exp) return false;
  return Date.now() >= token.exp * 1000;
}

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
      if (!entity) {
        if (!didCancel) {
          setState({ loading: false, hasAccess: false });
        }
        return;
      }

      let tokenString: string | undefined;
      try {
        const creds = await identityApi.getCredentials();
        tokenString = creds.token || undefined;
      } catch {
        if (!didCancel) {
          setState({ loading: false, hasAccess: false });
        }
        return;
      }

      if (!tokenString) {
        if (!didCancel) {
          setState({ loading: false, hasAccess: false });
        }
        return;
      }

      let decoded: JwtToken;
      try {
        decoded = jwtDecode<JwtToken>(tokenString);
      } catch {
        if (!didCancel) {
          setState({ loading: false, hasAccess: false });
        }
        return;
      }

      if (isTokenExpired(decoded)) {
        if (!didCancel) {
          setState({ loading: false, hasAccess: false });
        }
        return;
      }

      const context: CheckerContext = { isOwnedEntity };

      const checks = conditions.map(cond => {
        const checker = accessCheckerRegistry[cond];
        if (!checker) {
          return Promise.resolve(false);
        }
        return Promise.resolve(checker.check(entity, decoded, context));
      });

      try {
        const results = await Promise.all(checks);
        const hasAccess = results.some(r => r === true);
        if (!didCancel) {
          setState({ loading: false, hasAccess });
        }
      } catch {
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

  return {
    loading: ownershipLoading || state.loading,
    hasAccess: state.hasAccess,
  };
}