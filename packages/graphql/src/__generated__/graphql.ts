/* eslint-disable */
import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
};

export type Application = {
  __typename?: 'Application';
  agileEntityName: Maybe<Scalars['String']['output']>;
  backlog: Maybe<Backlog>;
  description: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  name: Maybe<Scalars['String']['output']>;
  team: Maybe<TeamStructure>;
};

export type Backlog = {
  __typename?: 'Backlog';
  id: Scalars['ID']['output'];
  issueSummaries: Maybe<Array<Maybe<IssueSummary>>>;
};

export type IssueSummary = {
  __typename?: 'IssueSummary';
  activeIssueCount: Maybe<Scalars['String']['output']>;
  issueIconUrl: Maybe<Scalars['String']['output']>;
  issueName: Maybe<Scalars['String']['output']>;
};

export type Query = {
  __typename?: 'Query';
  applicationById: Maybe<Application>;
  backlog: Maybe<Backlog>;
  team: Maybe<TeamStructure>;
};


export type QueryApplicationByIdArgs = {
  id: Scalars['ID']['input'];
};


export type QueryBacklogArgs = {
  id: Scalars['ID']['input'];
};


export type QueryTeamArgs = {
  id: Scalars['ID']['input'];
};

export type TeamMember = {
  __typename?: 'TeamMember';
  name: Maybe<Scalars['String']['output']>;
  role: Maybe<Scalars['String']['output']>;
};

export type TeamStructure = {
  __typename?: 'TeamStructure';
  id: Scalars['ID']['output'];
  teamMembers: Maybe<Array<Maybe<TeamMember>>>;
};

export type GetApplicationQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type GetApplicationQuery = { __typename?: 'Query', applicationById: { __typename?: 'Application', id: string, agileEntityName: string | null, name: string | null, description: string | null, backlog: { __typename?: 'Backlog', id: string, issueSummaries: Array<{ __typename?: 'IssueSummary', issueName: string | null, issueIconUrl: string | null, activeIssueCount: string | null } | null> | null } | null, team: { __typename?: 'TeamStructure', id: string, teamMembers: Array<{ __typename?: 'TeamMember', name: string | null, role: string | null } | null> | null } | null } | null };


export const GetApplicationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetApplication"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"applicationById"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"agileEntityName"}},{"kind":"Field","name":{"kind":"Name","value":"backlog"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"issueSummaries"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"issueName"}},{"kind":"Field","name":{"kind":"Name","value":"issueIconUrl"}},{"kind":"Field","name":{"kind":"Name","value":"activeIssueCount"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"team"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"teamMembers"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"role"}}]}}]}}]}}]}}]} as unknown as DocumentNode<GetApplicationQuery, GetApplicationQueryVariables>;