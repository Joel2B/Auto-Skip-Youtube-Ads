import { getValue, setValue } from 'pop-up/modules/data';

const visibleOptions = 3;
// height for each option
const optionHeight = 23.5;

export async function createSelect(selectOptions: HTMLSelectElement) {
  const id = selectOptions.id;

  let selectedOption = (await getValue(id)) as string | null;

  if (!selectedOption) {
    const option = selectOptions.options[selectOptions.selectedIndex];
    selectedOption = option.text;

    if (option.value != '') {
      selectedOption += '#' + selectOptions.value;
    }

    setValue(id, selectedOption);
  }
  const header = selectedOption.includes('#') ? selectedOption.split('#')[0] : selectedOption;
  let optionsHTML = '<div class="' + selectOptions.classList[0] + '">';
  optionsHTML += '<span class="custom-select-trigger">' + header + '</span>';
  optionsHTML += '<div class="custom-options"><div>';

  for (const option of Array.from(selectOptions.options)) {
    let dataValue = '';

    if (option.value != '') {
      dataValue = `data-value="${option.value}"`;
    }

    optionsHTML += `<span class="custom-option" ${dataValue}>${option.textContent}</span>`;
  }

  optionsHTML += '</div></div></div>';

  selectOptions.style.display = 'none';
  selectOptions.removeAttribute('class');
  selectOptions.removeAttribute('id');

  const customSelect = document.createElement('div');
  customSelect.className = 'custom-select-wrapper';
  customSelect.id = id;

  selectOptions.insertAdjacentElement('afterend', customSelect);
  selectOptions.remove();
  customSelect.innerHTML = selectOptions.outerHTML + optionsHTML;

  const customOption = Array.from(document.querySelectorAll<HTMLElement>(`#${id} .custom-option`));

  for (const option of customOption) {
    if (option.dataset.value != '' && option.dataset.value == selectedOption) {
      option.classList.add('selected');

      const trigger = document.querySelector<HTMLElement>(`#${id} .custom-select-trigger`);

      if (trigger) {
        trigger.textContent = option.textContent ?? '';
      }

      break;
    } else if (option.textContent == selectedOption) {
      option.classList.add('selected');
      break;
    }
  }

  const customOptions = document.querySelector<HTMLElement>(`#${id} .custom-options div`);

  if (!customOptions) {
    return;
  }

  if (customOption.length > visibleOptions) {
    customOptions.style.height = `${visibleOptions * optionHeight}px`;
  }

  customOptions.addEventListener(
    'mouseenter',
    () => {
      customOptions.setAttribute('tabindex', '-1');
      customOptions.focus();
    },
    false,
  );

  customOptions.addEventListener(
    'mouseleave',
    () => {
      customOptions.removeAttribute('tabindex');
    },
    false,
  );

  customOptions.addEventListener(
    'keypress',
    (e) => {
      for (const option of customOption) {
        if (e.key.toLowerCase() == option.textContent[0].toLowerCase()) {
          option.scrollIntoView();
          break;
        }
      }
    },
    false,
  );

  const customOptionsContainer = document.querySelector<HTMLElement>(`#${id} .custom-options`);

  if (customOptionsContainer) {
    customOptionsContainer.addEventListener(
      'click',
      function (event) {
        const target = event.target as HTMLElement | null;

        if (!target) {
          return;
        }

        let value = target.textContent ?? '';

        if (target.dataset.value) {
          value += '#' + target.dataset.value;
        }

        setValue(id, value);

        for (const option of customOption) {
          if (/selected/.test(option.className)) {
            option.classList.remove('selected');
          }
        }

        target.classList.add('selected');
        const parent = (this as HTMLElement).parentElement;

        if (parent) {
          parent.classList.remove('opened');
        }

        const trigger = document.querySelector<HTMLElement>(`#${id} .custom-select-trigger`);

        if (trigger) {
          trigger.textContent = target.textContent ?? '';
        }
      },
      false,
    );
  }

  const customSelectElement = document.querySelector<HTMLElement>(`#${id} .custom-select`);

  if (customSelectElement) {
    customSelectElement.addEventListener(
      'click',
      (event) => {
        const target = event.target as HTMLElement | null;
        const parent = target?.parentElement;

        if (parent?.classList.toggle('opened')) {
          for (const option of customOption) {
            if (/selected/.test(option.className)) {
              option.scrollIntoView();
            }
          }
        }
      },
      false,
    );
  }
}
