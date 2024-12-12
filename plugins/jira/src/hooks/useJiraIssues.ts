import { useApi } from '@backstage/core-plugin-api';
import { jiraApiRef } from '../api/JiraApi';
import { useState, useEffect } from 'react';
import { JiraIssueCounter } from '../api/JiraApi';

export function useJiraIssues(
  projectKey: string,
  options?: {
    component?: string;
    label?: string;
    statusesNames?: string[];
  },
) {
  const jiraApi = useApi(jiraApiRef);
  const [issues, setIssues] = useState<JiraIssueCounter[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error>();

  useEffect(() => {
    let mounted = true;

    async function fetchIssues() {
      if (!projectKey) return;

      setLoading(true);
      setError(undefined);

      try {
        const result = await jiraApi.getIssues(
          projectKey,
          options?.component,
          options?.label,
          options?.statusesNames,
        );
        if (mounted) {
          setIssues(result);
        }
      } catch (e) {
        if (mounted) {
          setError(e as Error);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    fetchIssues();

    return () => {
      mounted = false;
    };
  }, [jiraApi, projectKey, options?.component, options?.label, options?.statusesNames]);

  return { issues, loading, error };
} 