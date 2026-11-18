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
    personalPhotoTitle.textContent = link.dataset.photoTitle || (link.dataset.photo === 'coffee' ? 'Starbucks Coffee Master black apron' : 'On the pickleball court');
    personalPhotoDialog.showModal();
  });
});
if (personalPhotoDialog) personalPhotoDialog.addEventListener('click', event => {
  if (event.target !== personalPhotoDialog) return;
  const bounds = personalPhotoDialog.getBoundingClientRect();
  if (event.clientX < bounds.left || event.clientX > bounds.right ||
      event.clientY < bounds.top || event.clientY > bounds.bottom) personalPhotoDialog.close();
});

// Travel locations are supplied by Malcolm; pins use approximate country centers.
const travelMap = document.getElementById('travel-map');
const travelPins = [...document.querySelectorAll('[data-travel-pin]')];
const travelPlaces = [...document.querySelectorAll('[data-travel-place]')];
const travelViews = [...document.querySelectorAll('[data-travel-view]')];
const travelBounds = {
  world: [0, 0, 960, 400],
  americas: [133.3, 74.7, 202.7, 138.7],
  caribbean: [237.3, 149.3, 88, 61.3],
  europe: [437.3, 58.7, 160, 88],
  africa: [421.3, 125.3, 197.3, 197.3]
};
function setTravelView(name) {
  const bounds = travelBounds[name];
  if (!travelMap || !bounds) return;
  travelMap.setAttribute('viewBox', bounds.join(' '));
  travelViews.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.travelView === name)));
  const scale = bounds[2] / 960;
  travelPins.forEach(pin => {
    pin.querySelector('.travel-pin-dot').setAttribute('r', String(3.3 * scale));
    pin.querySelector('.travel-pin-halo').setAttribute('r', String(7.5 * scale));
  });
}
function selectTravelPlace(id) {
  const selected = travelPins.find(pin => pin.dataset.travelPin === id);
  if (!selected) return;
  travelPins.forEach(pin => pin.setAttribute('aria-pressed', String(pin === selected)));
  travelPlaces.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.travelPlace === id)));
  document.getElementById('travel-region').textContent = selected.dataset.region;
  document.getElementById('travel-place-name').textContent = selected.dataset.name;
  const note = document.getElementById('travel-place-note');
  note.textContent = selected.dataset.note;
  note.hidden = !selected.dataset.note;
  setTravelView(selected.dataset.view);
}
travelViews.forEach(button => button.addEventListener('click', () => setTravelView(button.dataset.travelView)));
travelPlaces.forEach(button => button.addEventListener('click', () => selectTravelPlace(button.dataset.travelPlace)));
travelPins.forEach(pin => {
  pin.addEventListener('click', () => selectTravelPlace(pin.dataset.travelPin));
  pin.addEventListener('keydown', event => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    selectTravelPlace(pin.dataset.travelPin);
  });
});
