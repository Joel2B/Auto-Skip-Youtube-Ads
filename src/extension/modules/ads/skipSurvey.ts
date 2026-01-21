import { getOption } from 'extension/modules/data';
import { sendMessageBackground } from 'utils/chrome/runtime';
import { deepQuerySelectorAll } from 'utils/query';
import { waitFor } from 'utils/utils';

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
