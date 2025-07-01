## Guide: Adding a Deep‑Dive Route to Any Backstage Plugin

> Use this checklist whenever you create a **“More details” / “Deep Dive”** view for a card that lives inside an entity page. The pattern keeps the URL stable (`/catalog/:kind/:namespace/:name/your‑slug`) and lets the plugin own its assets.

### Step 1 — Create a sub‑route

```ts
// routes.ts in your plugin folder
import { createSubRouteRef } from '@backstage/core-plugin-api';
import { entityRouteRef } from '@backstage/plugin-catalog-react';

export const entityFooDeepDiveRouteRef = createSubRouteRef({
  id: 'entity-foo-deep-dive',      // unique across your workspace
  parent: entityRouteRef,          // inherits :kind/:namespace/:name
  path: '/foo',                    // tail segment (no params!)
});
```

🎯 **Tip**: keep the tail short, lowercase, no leading slash in the string passed to `path`.

### Step 2 — Expose a routable extension

```ts
// plugin.ts
import { createRoutableExtension, createPlugin } from '@backstage/core-plugin-api';
import { entityFooDeepDiveRouteRef } from './routes';

export const fooPlugin = createPlugin({
  id: 'foo',
  routes: {
    deepDive: entityFooDeepDiveRouteRef, // optional – used only by external plugins
  },
});

export const EntityFooDeepDivePage = fooPlugin.provide(
  createRoutableExtension({
    name: 'EntityFooDeepDivePage',
    mountPoint: entityFooDeepDiveRouteRef,
    component: () => import('./components/EntityFooDeepDivePage')
      .then(m => m.EntityFooDeepDivePage),
  }),
);
```

### Step 3 — Add the React Router binding (app side)

```tsx
// packages/app/src/App.tsx
import { EntityFooDeepDivePage } from '@internal/plugin-foo';

<Route
  path="/catalog/:namespace/:kind/:name/foo/*"
  element={<EntityFooDeepDivePage />}
/>
```

If you’re already on the **new frontend‑plugin‑api**, you can skip this; the route is auto‑mounted when the plugin is added to `createApp({ features })`.

### Step 4 — Wire a button from the card

```tsx
import { useRouteRef } from '@backstage/core-plugin-api';
import { entityFooDeepDiveRouteRef } from '../routes';
import { useEntity } from '@backstage/plugin-catalog-react';

const deepDiveLink = useRouteRef(entityFooDeepDiveRouteRef);
const { entity } = useEntity();

<CustomInfoCard
  title="Foo Overview"
  deepDivePath={deepDiveLink({
    kind: entity.kind,
    namespace: entity.metadata.namespace ?? 'default',
    name: entity.metadata.name,
  })}
/>
```

With `deepDivePath` now supported by `CustomInfoCard`, you get an “open‑in‑new” icon in the card header automatically.

### Step 5 — Build the page skeleton

```tsx
export const EntityFooDeepDivePage = () => (
  <>
    <Typography variant="h4">Foo – Deep Dive</Typography>
    <Grid container spacing={3}>/* widgets */</Grid>
  </>
);
```

### That’s it!

* The card stays minimal.
* The plugin owns its heavy UI.
* The URL structure is consistent across plugins (`/foo`, `/jira`, `/tech-radar`, …).
