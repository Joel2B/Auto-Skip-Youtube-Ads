import { getOption } from 'extension/modules/data';
import { sendMessageBackground } from 'utils/chrome/runtime';
import { deepQuerySelectorAll } from 'utils/query';
import { waitFor } from 'utils/utils';
import { useBlockButton } from './ads/useBlockButton';
import { advanceSkip } from './ads/advanceSkip';

export const status = {
  block: false,
  skip: false,
};

export async function skipAd() {
  console.log('skipAd init');

  await useBlockButton();
  await advanceSkip();
}

export async function skipSurvey() {
  if (!getOption('skip-survey')) {
    return;
  }

  const answerButton = await waitFor(
    () =>
      deepQuerySelectorAll<HTMLElement | null>('[class="ytp-ad-survey-answer"]')
        .filter(
          (o) => o.innerHTML.toLowerCase().includes('awful') || o.innerHTML.toLowerCase().includes('very dissatisfied'),
        )
        .at(-1),
    {
      timeoutMs: 4000,
      intervalMs: 100,
      minMs: 2000,
    },
  );

  answerButton?.click();

  sendMessageBackground({
    id: 'analytics',
    value: 'surveys',
  });
}
