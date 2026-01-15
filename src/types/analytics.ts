export type AnalyticsMethodId = 1 | 2 | 3;
export type AnalyticsStatus = 0 | 1;

export type AnalyticsMethodStats = {
  error: number;
  success: number;
};

export type Analytics = {
  methods: Record<string, AnalyticsMethodStats>;
  overlayAds: number;
};

export type AnalyticsMethodUpdate = {
  method: AnalyticsMethodId;
  status: AnalyticsStatus;
};

export type AnalyticsUpdateValue = AnalyticsMethodUpdate | 'overlayAds';
