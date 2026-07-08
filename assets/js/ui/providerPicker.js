const picker  = document.getElementById('providerPicker');
const btn     = document.getElementById('providerBtn');
const label   = document.getElementById('providerBtnLabel');
const menu    = document.getElementById('providerMenu');

const STORAGE_KEY = 'libreprobe_provider';

const open  = () => { picker.classList.add('open');    btn.setAttribute('aria-expanded', 'true');  };
const close = () => { picker.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); };

btn.addEventListener('click', e => { e.stopPropagation(); picker.classList.contains('open') ? close() : open(); });
document.addEventListener('click', close);
menu.addEventListener('click', e => e.stopPropagation());

menu.addEventListener('keydown', e => {
  if (e.key === 'Escape') { close(); btn.focus(); }
});
btn.addEventListener('keydown', e => {
  if (e.key === 'Escape') close();
  if (e.key === 'ArrowDown') { open(); menu.querySelector('.provider-option')?.focus(); }
});

export function populateProviders(providers, selectedValue) {
  const saved = localStorage.getItem(STORAGE_KEY);
  const initial = saved && providers.some(p => p.value === saved) ? saved : selectedValue;

  menu.innerHTML = '';
  providers.forEach(p => {
    const li = document.createElement('li');
    li.className = 'provider-option' + (p.value === initial ? ' selected' : '');
    li.setAttribute('role', 'option');
    li.setAttribute('aria-selected', p.value === initial ? 'true' : 'false');
    li.setAttribute('tabindex', '0');
    li.dataset.value = p.value;
    li.textContent = p.label;
    li.addEventListener('click', () => selectProvider(p.value, p.label));
    li.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') selectProvider(p.value, p.label); });
    menu.appendChild(li);
  });
  label.textContent = providers.find(p => p.value === initial)?.label ?? providers[0]?.label ?? '';
  btn.disabled = false;
}

function selectProvider(value, text) {
  localStorage.setItem(STORAGE_KEY, value);
  menu.querySelectorAll('.provider-option').forEach(o => {
    o.classList.toggle('selected', o.dataset.value === value);
    o.setAttribute('aria-selected', o.dataset.value === value ? 'true' : 'false');
  });
  label.textContent = text;
  close();
  btn.dispatchEvent(new CustomEvent('provider:change', { detail: value, bubbles: true }));
}

export function getSelectedProvider() {
  return menu.querySelector('.provider-option.selected')?.dataset.value ?? localStorage.getItem(STORAGE_KEY) ?? null;
}

export function disablePicker() { btn.disabled = true; close(); }
export function enablePicker()  { btn.disabled = false; }