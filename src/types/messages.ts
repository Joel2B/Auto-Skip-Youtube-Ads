import type { AnalyticsUpdateValue } from 'types/analytics';

export type OptionValue = number | boolean | string;

export type AnalyticsMessage = {
  id: 'analytics';
  value: AnalyticsUpdateValue;
};

export type OptionMessage = {
  id: string;
  value: OptionValue;
};

export type ExtensionMessage = AnalyticsMessage | OptionMessage;

export const isAnalyticsMessage = (message: ExtensionMessage): message is AnalyticsMessage => {
  return message.id === 'analytics';
};
