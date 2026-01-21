import type { AnalyticsUpdateValue } from 'types/analytics';

export type OptionValue = number | boolean | string;

export type AnalyticsMessage = {
  id: 'analytics';
  value: AnalyticsUpdateValue;
};

export type DebuggerClickMessage = {
  id: 'debugger-click';
  value: {
    x: number;
    y: number;
  };
};

export type OptionMessage = {
  id: string;
  value: OptionValue;
};

export type ExtensionMessage = AnalyticsMessage | DebuggerClickMessage | OptionMessage;

export const isAnalyticsMessage = (message: ExtensionMessage): message is AnalyticsMessage => {
  return message.id === 'analytics';
};

export const isDebuggerClickMessage = (message: ExtensionMessage): message is DebuggerClickMessage => {
  return message.id === 'debugger-click';
};
