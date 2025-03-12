
/* <ai_context>
This component renders a custom homepage with "Hello World" and a search bar from @backstage/plugin-search.
</ai_context> */

import React from 'react';
import { HomePageSearchBar } from '@backstage/plugin-search';

export const CustomHomePage = () => {
  return (
    <div>
      <h1>Hello World</h1>
      <HomePageSearchBar />
    </div>
  );
};
      