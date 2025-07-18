export interface ResilienceData {
  chaosExperiment: {
    compliant: boolean;
    inScope: boolean;
    catchupDate: string;
    snapshotFacingDate: string | null;
  };
  incidents: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
}

export const useResilienceData = (): ResilienceData => {
  // Static data as per requirements
  return {
    chaosExperiment: {
      compliant: true,
      inScope: false,
      catchupDate: 'May 20, 2024',
      snapshotFacingDate: null,
    },
    incidents: {
      critical: 1,
      high: 3,
      medium: 3,
      low: 10,
    },
  };
};