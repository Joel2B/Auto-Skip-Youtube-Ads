import { getOption } from 'extension/modules/data';
import { sendMessageBackground } from 'utils/chrome/runtime';
import { deepQuerySelectorAll } from 'utils/query';
import { waitFor } from 'utils/utils';

export async function skipSurvey() {
  if (!getOption('skip-survey')) {
    return;
  }

  const answer = await waitFor(
    () => deepQuerySelectorAll<HTMLElement | null>('[class="ytp-ad-survey-answer"]').at(-1),
    {
      timeoutMs: 4000,
      intervalMs: 100,
      minMs: 1000,
    },
  );

  console.log(answer);

  const button = answer.querySelector('button');
  console.log(button);

  if (!button) {
    return;
  }

  button.click();

  sendMessageBackground({
    id: 'analytics',
    value: 'surveys',
  });
}
