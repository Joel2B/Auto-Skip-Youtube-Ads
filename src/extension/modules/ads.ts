import { useBlockButton } from './ads/useBlockButton';
import { advanceSkip } from './ads/advanceSkip';

export const status = {
  block: false,
};

export async function skipAd() {
  console.log('skipAd init');

  await useBlockButton();
  await advanceSkip();

  status.block = false;
}
