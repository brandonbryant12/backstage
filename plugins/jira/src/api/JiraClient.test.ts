import { Entity } from '@backstage/catalog-model';
import { JiraClient } from './JiraClient';
import { JIRA_PROJECT_KEY_ANNOTATION } from '../constants';

describe('JiraClient', () => {
  it('isJiraAvailable returns true if project key annotation is present', () => {
    const entity: Entity = {
      apiVersion: 'backstage.io/v1alpha1',
      kind: 'Component',
      metadata: {
        name: 'test-entity',
        annotations: {
          [JIRA_PROJECT_KEY_ANNOTATION]: 'TEST',
        },
      },
    };
    expect(JiraClient.isJiraAvailable(entity)).toBe(true);
  });

  it('isJiraAvailable returns false if project key annotation is missing', () => {
    const entity: Entity = {
      apiVersion: 'backstage.io/v1alpha1',
      kind: 'Component',
      metadata: {
        name: 'no-jira-here',
      },
    };
    expect(JiraClient.isJiraAvailable(entity)).toBe(false);
  });
});