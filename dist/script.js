"use strict";
const tabs = [...document.querySelectorAll('[data-tab]')];
function selectTab(name, focus = false) {
  const selected = tabs.find(tab => tab.dataset.tab === name);
  if (!selected) return;
  tabs.forEach(tab => {
    const active = tab === selected;
    tab.setAttribute('aria-selected', String(active));
    tab.tabIndex = active ? 0 : -1;
    document.getElementById(tab.getAttribute('aria-controls')).hidden = !active;
  });
  if (focus) selected.focus();
}
tabs.forEach((tab, index) => {
  tab.addEventListener('click', () => selectTab(tab.dataset.tab));
  tab.addEventListener('keydown', event => {
    let next;
    if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
    if (event.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = tabs.length - 1;
    if (next !== undefined) {event.preventDefault();selectTab(tabs[next].dataset.tab, true);}
  });
});
document.querySelectorAll('[data-select]').forEach(link => link.addEventListener('click', () => selectTab(link.dataset.select)));
document.getElementById('year').textContent = new Date().getFullYear();
