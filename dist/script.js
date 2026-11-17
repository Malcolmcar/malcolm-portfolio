"use strict";
document.querySelectorAll('[data-reveal]').forEach(link => {
  link.addEventListener('click', () => {
    const section = document.getElementById(link.dataset.reveal);
    if (section instanceof HTMLDetailsElement) section.open = true;
  });
});
document.getElementById('year').textContent = new Date().getFullYear();

const personalPhotoDialog = document.getElementById('personal-photo-dialog');
const personalPhotoFull = document.getElementById('personal-photo-full');
const personalPhotoTitle = document.getElementById('personal-photo-title');
document.querySelectorAll('[data-photo]').forEach(link => {
  link.addEventListener('click', event => {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey ||
        !personalPhotoDialog || typeof personalPhotoDialog.showModal !== 'function') return;
    event.preventDefault();
    const thumbnail = link.querySelector('img');
    personalPhotoFull.src = link.getAttribute('href');
    personalPhotoFull.alt = thumbnail.alt;
    personalPhotoTitle.textContent = link.dataset.photo === 'coffee' ? 'Starbucks Coffee Master black apron' : 'On the pickleball court';
    personalPhotoDialog.showModal();
  });
});
if (personalPhotoDialog) personalPhotoDialog.addEventListener('click', event => {
  if (event.target !== personalPhotoDialog) return;
  const bounds = personalPhotoDialog.getBoundingClientRect();
  if (event.clientX < bounds.left || event.clientX > bounds.right ||
      event.clientY < bounds.top || event.clientY > bounds.bottom) personalPhotoDialog.close();
});
