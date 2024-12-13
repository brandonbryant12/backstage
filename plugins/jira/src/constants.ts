import { Entity } from '@backstage/catalog-model';

export const JIRA_COMPONENT_ANNOTATION = 'jira/component';
export const JIRA_BEARER_TOKEN_ANNOTATION = 'jira/token-type';
export const JIRA_PROJECT_KEY_ANNOTATION = 'jira/project-key';
export const JIRA_LABEL_ANNOTATION = 'jira/label';
export const JIRA_TEAM_ANNOTATION = 'jira/team';
export const DEFAULT_JIRA_QUERY_ANNOTATION = 'jira/all-issues-jql';

export const isJiraAvailable = (entity: Entity) =>
  Boolean(entity?.metadata.annotations?.[JIRA_PROJECT_KEY_ANNOTATION]);