import { getValue, setValue } from 'pop-up/modules/data';

export async function setupNumberInput(numberInput: HTMLElement) {
  const input = numberInput.querySelector<HTMLInputElement>('input[type="number"]');
  const minus = numberInput.querySelector<HTMLButtonElement>('.minus');
  const plus = numberInput.querySelector<HTMLButtonElement>('.plus');

  if (!input || !minus || !plus) {
    return;
  }

  const id = input.id;
  let lastValue = Number(input.value);

  let value = await getValue<number | null>(id);

  if (value == null) {
    value = Number(input.value);
    setValue(id, value);
  }

  input.value = String(value);

  input.addEventListener(
    'click',
    () => {
      input.select();
    },
    false,
  );

  input.addEventListener(
    'blur',
    () => {
      if (input.value == '') {
        input.value = String(lastValue);
      }
    },
    false,
  );

  input.addEventListener(
    'keydown',
    (e) => {
      if (e.key === 'Backspace') {
        return;
      }

      if (!e.repeat) {
        const value = Number(input.value);
        const minValue = Number(input.min);
        const maxValue = Number(input.max);

        if (!Number.isNaN(minValue) && !Number.isNaN(maxValue) && value >= minValue && value <= maxValue) {
          lastValue = value;
        }
      }
    },
    false,
  );

  input.addEventListener(
    'keyup',
    (e) => {
      if (e.key === 'Backspace') {
        return;
      }

      if (input.min != '' && input.max != '') {
        const value = Number(input.value);
        const minValue = Number(input.min);
        const maxValue = Number(input.max);

        if (!Number.isNaN(minValue) && !Number.isNaN(maxValue) && value >= minValue && value <= maxValue) {
          setValue(id, value);
        } else {
          input.value = String(lastValue);
        }
      }
    },
    false,
  );

  minus.addEventListener(
    'click',
    () => {
      if (input.min != '') {
        let value = Number(input.value);
        const minValue = Number(input.min);

        if (!Number.isNaN(minValue) && value > minValue) {
          input.value = String(--value);
          setValue(id, value);
        }
      }
    },
    false,
  );

  plus.addEventListener(
    'click',
    () => {
      if (input.max != '') {
        let value = Number(input.value);

        const maxValue = Number(input.max);

        if (!Number.isNaN(maxValue) && value < maxValue) {
          input.value = String(++value);
          setValue(id, value);
        }
      }
    },
    false,
  );
}
