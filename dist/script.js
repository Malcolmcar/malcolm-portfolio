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


// Natural Earth geography uses an equirectangular projection. Most pins represent
// countries/territories; the three named cities have their own coordinates.
const travelMap = document.getElementById("travel-map");
if (travelMap) {
  const pins = [...travelMap.querySelectorAll("[data-travel-pin]")];
  const clusters = [...travelMap.querySelectorAll("[data-travel-cluster]")];
  const viewButtons = [...document.querySelectorAll("[data-travel-view]")];
  const destination = document.getElementById("travel-destination");
  const chips = document.getElementById("destination-chips");
  const leaders = travelMap.querySelector(".travel-leaders");
  const regionLabel = document.getElementById("travel-region");
  const placeName = document.getElementById("travel-place-name");
  const placeContext = document.getElementById("travel-context");
  const placeNote = document.getElementById("travel-place-note");
  const coordinates = document.getElementById("travel-coordinates");
  const hint = document.getElementById("travel-view-hint");
  const bounds = {
    world: [0, 0, 960, 400],
    europe: [437, 62, 164, 96],
    americas: [145, 75, 205, 142],
    caribbean: [230, 146, 92, 57],
    africa: [418, 120, 195, 220]
  };
  const viewNames = { world: "The world", europe: "Europe", americas: "The Americas", caribbean: "Caribbean & Central America", africa: "Africa" };
  let currentView = "world";
  let selectedId = "spain";
  let layoutFrame;

  function matchesView(pin, view) {
    return view === "world" || pin.dataset.view === view ||
      (view === "americas" && pin.dataset.view === "caribbean");
  }

  function updateSelection() {
    pins.forEach(pin => pin.setAttribute("aria-pressed", String(pin.dataset.travelPin === selectedId)));
    clusters.forEach(cluster => cluster.setAttribute("aria-pressed", String(
      pins.some(pin => pin.dataset.travelPin === selectedId && pin.dataset.view === cluster.dataset.travelCluster)
    )));
    chips.querySelectorAll("button").forEach(button => {
      button.setAttribute("aria-pressed", String(button.dataset.travelPlace === selectedId));
    });
    destination.value = selectedId || "";
    const selected = pins.find(pin => pin.dataset.travelPin === selectedId);
    if (selected) {
      const { name, country, region, note, context, coordinate } = selected.dataset;
      regionLabel.textContent = `${country} · ${region}`;
      placeName.textContent = name;
      placeContext.textContent = context;
      placeNote.textContent = note || "One of the places I’ve visited along the way.";
      coordinates.textContent = coordinate || "Country / territory · Representative location";
    } else {
      regionLabel.textContent = "Places & Postcards";
      placeName.textContent = viewNames[currentView];
      placeContext.textContent = `${pins.filter(pin => matchesView(pin, currentView)).length} countries & territories`;
      placeNote.textContent = "Choose a destination from the map or menu to take a closer look.";
      coordinates.textContent = "A collection of places that have shaped my perspective.";
    }
  }

  function renderChips() {
    // Keeping the existing buttons preserves keyboard focus when a chip is used.
    if (chips.dataset.view === currentView) return;
    chips.dataset.view = currentView;
    chips.replaceChildren();
    if (currentView === "world") return;
    const regionPins = pins.filter(pin => matchesView(pin, currentView))
      .sort((a, b) => a.dataset.country.localeCompare(b.dataset.country));
    regionPins.forEach(pin => {
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.travelPlace = pin.dataset.travelPin;
      button.textContent = pin.dataset.country;
      button.addEventListener("click", () => selectPlace(pin.dataset.travelPin));
      chips.append(button);
    });
  }

  function setVisibility(element, visible) {
    element.toggleAttribute("hidden", !visible);
    element.setAttribute("tabindex", visible ? "0" : "-1");
    if (visible) element.removeAttribute("aria-hidden");
    else element.setAttribute("aria-hidden", "true");
  }

  function layoutMarkers() {
    const box = travelMap.getBoundingClientRect();
    if (!box.width || !box.height) return;
    const [left, top, width, height] = bounds[currentView];
    // One map unit per screen pixel is recalculated on resize and on every zoom.
    // Circles and 44px targets therefore keep their screen size in every view.
    const unitsPerPixel = Math.max(width / box.width, height / box.height);
    const visible = [...pins, ...clusters].filter(node => !node.hasAttribute("hidden"));
    const points = visible.map(node => ({
      node,
      x: Number(node.dataset.x), y: Number(node.dataset.y),
      originalX: Number(node.dataset.x), originalY: Number(node.dataset.y),
      radius: node.hasAttribute("data-travel-cluster") ? 26 : 22
    }));
    // Separate crowded targets gently and draw a leader back to the true point.
    // This changes only screen placement, never the underlying city coordinates.
    for (let pass = 0; pass < 45; pass++) {
      let moved = false;
      for (let i = 0; i < points.length; i++) {
        for (let j = i + 1; j < points.length; j++) {
          const a = points[i], b = points[j];
          const dx = b.x - a.x, dy = b.y - a.y;
          const distance = Math.hypot(dx, dy);
          const minimum = (a.radius + b.radius + 3) * unitsPerPixel;
          if (distance >= minimum) continue;
          const angle = distance ? Math.atan2(dy, dx) : (i + j) * 2.4;
          const push = (minimum - distance) * .51;
          a.x -= Math.cos(angle) * push; a.y -= Math.sin(angle) * push;
          b.x += Math.cos(angle) * push; b.y += Math.sin(angle) * push;
          moved = true;
        }
      }
      points.forEach(point => {
        const margin = (point.radius + 4) * unitsPerPixel;
        point.x = Math.max(left + margin, Math.min(left + width - margin, point.x));
        point.y = Math.max(top + margin, Math.min(top + height - margin, point.y));
      });
      if (!moved) break;
    }
    leaders.replaceChildren();
    points.forEach(point => {
      point.node.setAttribute("transform", `translate(${point.x} ${point.y}) scale(${unitsPerPixel})`);
      if (Math.hypot(point.x - point.originalX, point.y - point.originalY) < unitsPerPixel * 2) return;
      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("x1", point.originalX); line.setAttribute("y1", point.originalY);
      line.setAttribute("x2", point.x); line.setAttribute("y2", point.y);
      leaders.append(line);
    });
  }

  function scheduleLayout() {
    cancelAnimationFrame(layoutFrame);
    layoutFrame = requestAnimationFrame(layoutMarkers);
  }

  function setView(name) {
    if (!bounds[name]) return;
    currentView = name;
    travelMap.setAttribute("viewBox", bounds[name].join(" "));
    viewButtons.forEach(button => button.setAttribute("aria-pressed", String(button.dataset.travelView === name)));
    pins.forEach(pin => {
      const clustered = (name === "world" && ["europe", "caribbean"].includes(pin.dataset.view)) ||
        (name === "americas" && pin.dataset.view === "caribbean");
      setVisibility(pin, matchesView(pin, name) && !clustered);
    });
    clusters.forEach(cluster => setVisibility(cluster,
      name === "world" || (name === "americas" && cluster.dataset.travelCluster === "caribbean")
    ));
    const selected = pins.find(pin => pin.dataset.travelPin === selectedId);
    if (selected && !matchesView(selected, name)) selectedId = "";
    hint.textContent = name === "world" ? "Select a regional cluster or a destination to explore." :
      name === "americas" ? "Select a destination, or open the Caribbean cluster." :
      "Select a pin or choose a destination below.";
    renderChips();
    updateSelection();
    layoutMarkers();
  }

  function selectPlace(id) {
    const selected = pins.find(pin => pin.dataset.travelPin === id);
    if (!selected) return;
    selectedId = id;
    setView(selected.dataset.view);
  }

  viewButtons.forEach(button => button.addEventListener("click", () => setView(button.dataset.travelView)));
  destination.addEventListener("change", () => {
    if (destination.value) selectPlace(destination.value);
    else { selectedId = ""; updateSelection(); }
  });
  pins.forEach(pin => pin.addEventListener("click", () => selectPlace(pin.dataset.travelPin)));
  clusters.forEach(cluster => cluster.addEventListener("click", () => {
    const hadFocus = document.activeElement === cluster;
    setView(cluster.dataset.travelCluster);
    if (hadFocus) pins.find(pin => !pin.hasAttribute("hidden"))?.focus({ preventScroll: true });
  }));
  [...pins, ...clusters].forEach(marker => marker.addEventListener("keydown", event => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      marker.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    } else if (["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp", "Home", "End"].includes(event.key)) {
      event.preventDefault();
      const visible = [...pins, ...clusters].filter(node => !node.hasAttribute("hidden"));
      const index = visible.indexOf(marker);
      const next = event.key === "Home" ? 0 : event.key === "End" ? visible.length - 1 :
        (index + (["ArrowLeft", "ArrowUp"].includes(event.key) ? -1 : 1) + visible.length) % visible.length;
      visible[next]?.focus({ preventScroll: true });
    }
  }));
  if (typeof ResizeObserver === "function") new ResizeObserver(scheduleLayout).observe(travelMap);
  else window.addEventListener("resize", scheduleLayout);
  setView("world");
  document.fonts?.ready.then(scheduleLayout);
}
