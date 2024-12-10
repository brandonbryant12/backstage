import React from 'react';
import { createDevApp } from '@backstage/dev-utils';
import { jiraPlugin, JiraPage } from '../src/plugin';

createDevApp()
  .registerPlugin(jiraPlugin)
  .addPage({
    element: <JiraPage />,
    title: 'Root Page',
    path: '/jira',
  })
  .render();
