import { Platform } from 'react-native';

const API_ENDPOINT = 'https://api.esustellar.com/analytics';

export type EventType = 'session_start' | 'session_end' | 'feature_used' | 'screen_view' | 'subscription_action';

export interface AnalyticsEvent {
  type: EventType;
  timestamp: string;
  payload: Record<string, unknown>;
  platform: string;
}

const trackEvent = async (event: AnalyticsEvent) => {
  try {
    // In a real scenario we'd batch these or use an analytics SDK
    await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    });
    console.log('[Analytics] Event logged:', event.type);
  } catch (error) {
    console.warn('[Analytics] Failed to log event', error);
  }
};

export const Analytics = {
  logSessionStart: (userId?: string) => {
    trackEvent({
      type: 'session_start',
      timestamp: new Date().toISOString(),
      payload: { userId },
      platform: Platform.OS,
    });
  },

  logFeatureUsage: (featureName: string, metadata?: Record<string, unknown>) => {
    trackEvent({
      type: 'feature_used',
      timestamp: new Date().toISOString(),
      payload: { featureName, ...metadata },
      platform: Platform.OS,
    });
  },

  logScreenView: (screenName: string) => {
    trackEvent({
      type: 'screen_view',
      timestamp: new Date().toISOString(),
      payload: { screenName },
      platform: Platform.OS,
    });
  },
  
  getInternalMetrics: async () => {
    // Dummy implementation for the dashboard
    return {
      activeSessions: 142,
      topFeatures: [
        { name: 'WalletTransfer', uses: 890 },
        { name: 'SubscriptionUpgrade', uses: 45 },
      ],
      totalUsers: 5000,
    };
  }
};
