"use strict";
document.querySelectorAll('[data-reveal]').forEach(link => {
  link.addEventListener('click', () => {
    const section = document.getElementById(link.dataset.reveal);
    if (section instanceof HTMLDetailsElement) section.open = true;
  });
});
document.getElementById('year').textContent = new Date().getFullYear();
