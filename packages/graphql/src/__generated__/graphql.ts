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
  team: Maybe<ApplicationTeam>;
};

export type ApplicationTeam = {
  __typename?: 'ApplicationTeam';
  associates: Array<Associate>;
  id: Scalars['ID']['output'];
  name: Maybe<Scalars['String']['output']>;
};

export type Associate = {
  __typename?: 'Associate';
  description: Maybe<Scalars['String']['output']>;
  email: Maybe<Scalars['String']['output']>;
  imageUrl: Maybe<Scalars['String']['output']>;
  link: Maybe<Scalars['String']['output']>;
  name: Scalars['String']['output'];
  role: Maybe<Scalars['String']['output']>;
};

export type Backlog = {
  __typename?: 'Backlog';
  backlogUrl: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  issueSummaries: Array<IssueSummary>;
};

export type IssueSummary = {
  __typename?: 'IssueSummary';
  count: Scalars['String']['output'];
  iconUrl: Scalars['String']['output'];
  name: Scalars['String']['output'];
};

export type Query = {
  __typename?: 'Query';
  applicationById: Maybe<Application>;
  applicationTeam: Maybe<ApplicationTeam>;
  backlog: Maybe<Backlog>;
};


export type QueryApplicationByIdArgs = {
  id: Scalars['ID']['input'];
};


export type QueryApplicationTeamArgs = {
  id: Scalars['ID']['input'];
};


export type QueryBacklogArgs = {
  id: Scalars['ID']['input'];
};

export type GetApplicationQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type GetApplicationQuery = { __typename?: 'Query', applicationById: { __typename?: 'Application', id: string, name: string | null, description: string | null, backlog: { __typename?: 'Backlog', backlogUrl: string, id: string, issueSummaries: Array<{ __typename?: 'IssueSummary', name: string, iconUrl: string, count: string }> } | null, team: { __typename?: 'ApplicationTeam', name: string | null, associates: Array<{ __typename?: 'Associate', name: string, description: string | null, email: string | null, role: string | null, imageUrl: string | null, link: string | null }> } | null } | null };


export const GetApplicationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetApplication"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"applicationById"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"backlog"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"backlogUrl"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"issueSummaries"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"iconUrl"}},{"kind":"Field","name":{"kind":"Name","value":"count"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"team"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"associates"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"imageUrl"}},{"kind":"Field","name":{"kind":"Name","value":"link"}}]}}]}}]}}]}}]} as unknown as DocumentNode<GetApplicationQuery, GetApplicationQueryVariables>;