// // useEntityAccessCheck.test.ts

// import React from 'react';
// import { renderHook } from '@testing-library/react-hooks';
// import { useEntity, useEntityOwnership } from '@backstage/plugin-catalog-react';
// import { identityApiRef } from '@backstage/core-plugin-api';
// import { TestApiProvider } from '@backstage/test-utils';
// import { useEntityAccessCheck } from './useEntityAccessCheck';

// // Mock the catalog-react hooks so we can control their return values
// jest.mock('@backstage/plugin-catalog-react', () => ({
//   useEntity: jest.fn(),
//   useEntityOwnership: jest.fn(),
// }));

// const mockGetCredentials = jest.fn();

// describe('useEntityAccessCheck', () => {
//   beforeEach(() => {
//     jest.resetAllMocks();
//     // By default, let getCredentials return a "valid" token
//     mockGetCredentials.mockResolvedValue({ token: createFakeToken({ sub: 'myuser', exp: futureExp() }) });
//   });

//   function renderUseEntityAccessCheck(conditions?: string[]) {
//     return renderHook(
//       () => useEntityAccessCheck(conditions as any),
//       {
//         wrapper: ({ children }) => (
//           <TestApiProvider
//             apis={[[identityApiRef, { getCredentials: mockGetCredentials }]]}
//           >
//             {children}
//           </TestApiProvider>
//         ),
//       },
//     );
//   }

//   it('returns hasAccess=false if entity is not present', async () => {
//     (useEntity as jest.Mock).mockReturnValue({ entity: undefined });
//     (useEntityOwnership as jest.Mock).mockReturnValue({
//       loading: false,
//       isOwnedEntity: jest.fn(),
//     });

//     const { result, waitForNextUpdate } = renderUseEntityAccessCheck();
//     await waitForNextUpdate();

//     expect(result.current.loading).toBe(false);
//     expect(result.current.hasAccess).toBe(false);
//   });

//   it('returns false if no token is provided', async () => {
//     (useEntity as jest.Mock).mockReturnValue({ entity: { metadata: {} } });
//     (useEntityOwnership as jest.Mock).mockReturnValue({
//       loading: false,
//       isOwnedEntity: jest.fn().mockReturnValue(false),
//     });
//     mockGetCredentials.mockResolvedValue({ token: null });

//     const { result, waitForNextUpdate } = renderUseEntityAccessCheck();
//     await waitForNextUpdate();

//     expect(result.current.loading).toBe(false);
//     expect(result.current.hasAccess).toBe(false);
//   });

//   it('returns false if token is expired', async () => {
//     (useEntity as jest.Mock).mockReturnValue({ entity: { metadata: {} } });
//     (useEntityOwnership as jest.Mock).mockReturnValue({
//       loading: false,
//       isOwnedEntity: jest.fn().mockReturnValue(false),
//     });
//     const expiredToken = createFakeToken({ sub: 'myuser', exp: 1 }); // definitely in the past
//     mockGetCredentials.mockResolvedValue({ token: expiredToken });

//     const { result, waitForNextUpdate } = renderUseEntityAccessCheck();
//     await waitForNextUpdate();

//     expect(result.current.loading).toBe(false);
//     expect(result.current.hasAccess).toBe(false);
//   });

//   it('grants access if "owner" check passes', async () => {
//     (useEntity as jest.Mock).mockReturnValue({ entity: { metadata: {} } });
//     (useEntityOwnership as jest.Mock).mockReturnValue({
//       loading: false,
//       isOwnedEntity: jest.fn().mockReturnValue(true),
//     });
//     // The token is valid by default

//     const { result, waitForNextUpdate } = renderUseEntityAccessCheck(['owner']);
//     await waitForNextUpdate();

//     expect(result.current.loading).toBe(false);
//     expect(result.current.hasAccess).toBe(true);
//   });

//   it('denies access if all checks fail', async () => {
//     (useEntity as jest.Mock).mockReturnValue({ entity: { metadata: {} } });
//     (useEntityOwnership as jest.Mock).mockReturnValue({
//       loading: false,
//       isOwnedEntity: jest.fn().mockReturnValue(false),
//     });

//     // Has no ADGroup annotation, no serviceNowContact relation => fails
//     // We'll pass conditions for which the entity doesn't match
//     const { result, waitForNextUpdate } = renderUseEntityAccessCheck([
//       'owner',
//       'ADGroup',
//       'serviceNowContact',
//     ]);
//     await waitForNextUpdate();

//     expect(result.current.loading).toBe(false);
//     expect(result.current.hasAccess).toBe(false);
//   });

//   it('catches errors in getCredentials and returns false', async () => {
//     (useEntity as jest.Mock).mockReturnValue({ entity: { metadata: {} } });
//     (useEntityOwnership as jest.Mock).mockReturnValue({
//       loading: false,
//       isOwnedEntity: jest.fn(),
//     });
//     mockGetCredentials.mockRejectedValue(new Error('Oops'));

//     const { result, waitForNextUpdate } = renderUseEntityAccessCheck();
//     await waitForNextUpdate();

//     expect(result.current.loading).toBe(false);
//     expect(result.current.hasAccess).toBe(false);
//   });

//   it('passes if at least one condition is true among many', async () => {
//     (useEntity as jest.Mock).mockReturnValue({
//       entity: {
//         metadata: {
//           annotations: {
//             MicrosoftADGroups: 'DevTeam, SomeOtherGroup',
//           },
//         },
//       },
//     });
//     (useEntityOwnership as jest.Mock).mockReturnValue({
//       loading: false,
//       isOwnedEntity: jest.fn().mockReturnValue(false),
//     });
//     const token = createFakeToken({ sub: 'myuser', exp: futureExp(), groups: ['DevTeam'] });
//     mockGetCredentials.mockResolvedValue({ token });

//     const { result, waitForNextUpdate } = renderUseEntityAccessCheck(['owner', 'ADGroup']);
//     await waitForNextUpdate();

//     expect(result.current.loading).toBe(false);
//     // Not an owner, but ADGroup matches => pass
//     expect(result.current.hasAccess).toBe(true);
//   });
// });

// /**
//  * Utility: create a “fake” JWT that decodes properly with jwtDecode.
//  * We just base64-encode a JSON header and JSON payload. 
//  */
// function createFakeToken(payload: Record<string, any>) {
//   const header = { alg: 'HS256', typ: 'JWT' };
//   const base64 = (obj: any) =>
//     Buffer.from(JSON.stringify(obj), 'utf8').toString('base64');
//   return [base64(header), base64(payload), 'signature'].join('.');
// }

// function futureExp(): number {
//   // returns a timestamp in the future
//   return Math.floor(Date.now() / 1000) + 60 * 60; // +1 hour
// }
