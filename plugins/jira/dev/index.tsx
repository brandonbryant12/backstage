import React, { useEffect, useState } from 'react';
import { createDevApp } from '@backstage/dev-utils';
import { jiraPlugin } from '../src/plugin';
import { jiraApiRef } from '../src/api/JiraApi';
import { MockJiraClient } from '../src/api/MockJiraClient';
import { useApi } from '@backstage/core-plugin-api';
import { Typography, List, ListItem, ListItemAvatar, Avatar, ListItemText } from '@material-ui/core';

const JiraMockIssuesPage = () => {
  const jiraApi = useApi(jiraApiRef);
  const [issues, setIssues] = useState([]);
  
  useEffect(() => {
    let mounted = true;
    jiraApi.getIssues('TEST').then(data => {
      if (mounted) {
        setIssues(data);
      }
    }).catch(err => {
      console.error('Failed to fetch issues:', err);
    });
    return () => {
      mounted = false;
    };
  }, [jiraApi]);

  return (
    <div style={{ padding: '1rem' }}>
      <Typography variant="h4">Mock Jira Issues</Typography>
      <List>
        {issues.map((issue: any, index: number) => (
          <ListItem key={index}>
            <ListItemAvatar>
              <Avatar src={issue.iconUrl} />
            </ListItemAvatar>
            <ListItemText
              primary={`${issue.name}`}
              secondary={`Total: ${issue.total}`}
            />
          </ListItem>
        ))}
      </List>
    </div>
  );
};

createDevApp()
  .registerPlugin(jiraPlugin)
  .registerApi({
    api: jiraApiRef,
    deps: {},
    factory: () => new MockJiraClient(),
  })
  .addPage({
    element: <JiraMockIssuesPage />,
    title: 'Mock Jira Issues',
    path: '/jira',
  })
  .render();