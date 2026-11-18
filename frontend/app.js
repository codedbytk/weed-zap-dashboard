const events = [
  { time: '00:03', type: 'weed', label: 'Weed detected', detail: 'Target identified · cutter action simulated', result: 'Cut in simulation' },
  { time: '00:06', type: 'crop', label: 'Crop recognized', detail: 'Plant classified as crop · no action taken', result: 'Protected' },
  { time: '00:09', type: 'weed', label: 'Weed detected', detail: 'Target identified · cutter action simulated', result: 'Cut in simulation' },
  { time: '00:12', type: 'safety', label: 'Cut skipped', detail: 'Weed 12 cm from a crop · clearance rule', result: 'Crop protected' },
  { time: '00:16', type: 'crop', label: 'Crop recognized', detail: 'Plant classified as crop · no action taken', result: 'Protected' },
  { time: '00:20', type: 'weed', label: 'Weed detected', detail: 'Target identified · cutter action simulated', result: 'Cut in simulation' }
];

const runs = [
  { date: new Date(), mode: 'PC simulation', weeds: '11 / 11', contacts: '0', result: 'Completed' }
];

const pageDetails = {
  overview: { title: 'Field overview', description: 'A clear view of your robot’s latest activity.' },
  detections: { title: 'Detection log', description: 'Review the plants and decisions recorded in the demo run.' },
  history: { title: 'Patrol history', description: 'A record of mock and documented simulation runs.' }
};

const breadcrumbLabels = {
  overview: 'Overview',
  detections: 'Detections',
  history: 'Patrol history'
};

const iconForEvent = (type) => {
  if (type === 'weed') return 'icon-sprout';
  if (type === 'safety') return 'icon-shield';
  return 'icon-leaf';
};

const labelForType = (type) => {
  if (type === 'weed') return 'WEED';
  if (type === 'safety') return 'SAFETY';
  return 'CROP';
};

function renderEvents(target, filter = 'all', limit = events.length) {
  const visibleEvents = events
    .filter((event) => filter === 'all' || event.type === filter)
    .slice(0, limit);

  target.innerHTML = visibleEvents.map((event) => `
    <div class="event-row">
      <span class="event-icon event-${event.type}"><svg class="icon"><use href="#${iconForEvent(event.type)}"></use></svg></span>
      <div class="event-copy"><div class="event-title">${event.label}<span class="event-type event-type-${event.type}">${labelForType(event.type)}</span></div><div class="event-detail">${event.detail}</div></div>
      <span class="event-result result-${event.type}">${event.result}</span>
      <time class="event-time">${event.time}</time>
    </div>`).join('');
}

function renderHistory() {
  document.querySelector('#history-rows').innerHTML = runs.map((run) => `
    <tr>
      <td><strong>Weed-Zap test run</strong><span class="table-subtitle">Illustrative result</span></td>
      <td>${run.date.toLocaleDateString([], { month: 'short', day: '2-digit', year: 'numeric' })} · ${run.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
      <td><span class="mode-tag">${run.mode}</span></td>
      <td class="table-number">${run.weeds}</td>
      <td class="table-number">${run.contacts}</td>
      <td><span class="complete-tag"><i></i>${run.result}</span></td>
    </tr>`).join('');
}

function updateEventCounts() {
  document.querySelector('.nav-count').textContent = String(events.length).padStart(2, '0');
  document.querySelectorAll('[data-filter]').forEach((button) => {
    const count = button.dataset.filter === 'all'
      ? events.length
      : events.filter((event) => event.type === button.dataset.filter).length;
    button.querySelector('span').textContent = String(count).padStart(2, '0');
  });
}

function showView(view) {
  document.querySelectorAll('[data-view-panel]').forEach((panel) => {
    panel.hidden = panel.dataset.viewPanel !== view;
  });
  document.querySelectorAll('[data-view]').forEach((button) => {
    const active = button.dataset.view === view;
    button.classList.toggle('is-active', active);
    if (active) button.setAttribute('aria-current', 'page');
    else button.removeAttribute('aria-current');
  });

  const details = pageDetails[view];
  document.querySelector('#page-title').textContent = details.title;
  document.querySelector('#page-description').textContent = details.description;
  document.querySelector('#breadcrumb-current').textContent = breadcrumbLabels[view];
}

function showToast(message) {
  const toast = document.querySelector('#toast');
  toast.textContent = message;
  toast.classList.add('is-visible');
  window.clearTimeout(showToast.timeoutId);
  showToast.timeoutId = window.setTimeout(() => toast.classList.remove('is-visible'), 3200);
}

function replayDemo() {
  const buttons = document.querySelectorAll('[data-replay]');
  if ([...buttons].some((button) => button.disabled)) return;

  buttons.forEach((button) => {
    button.disabled = true;
    button.classList.add('is-running');
    button.querySelector('span').textContent = 'Running demo…';
  });
  showToast('Replaying the documented PC simulation with mock events.');

  window.setTimeout(() => {
    const now = new Date();
    const timeLabel = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    runs.unshift({
      date: now,
      mode: 'Demo replay',
      weeds: '11 / 11',
      contacts: '0',
      result: 'Completed'
    });
    events.unshift({
      time: timeLabel,
      type: 'weed',
      label: 'Demo run replayed',
      detail: '11 weeds cut · 0 crop contacts · PC simulation',
      result: 'Mock result'
    });
    renderEvents(document.querySelector('#overview-events'), 'all', 4);
    renderEvents(document.querySelector('#detection-events'), document.querySelector('.filter-chip.is-selected').dataset.filter);
    renderHistory();
    updateEventCounts();
    buttons.forEach((button) => {
      button.disabled = false;
      button.classList.remove('is-running');
      button.querySelector('span').textContent = 'Replay demo run';
    });
    showToast('Demo replay complete · mock results added to the activity log.');
  }, 1100);
}

document.querySelector('#today-label').textContent = new Date().toLocaleDateString([], {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
  year: 'numeric'
});

document.querySelectorAll('[data-view]').forEach((button) => {
  button.addEventListener('click', () => showView(button.dataset.view));
});
document.querySelectorAll('[data-view-link]').forEach((button) => {
  button.addEventListener('click', () => showView(button.dataset.viewLink));
});
document.querySelector('[data-home]').addEventListener('click', (event) => {
  event.preventDefault();
  showView('overview');
});
document.querySelectorAll('[data-replay]').forEach((button) => button.addEventListener('click', replayDemo));
document.querySelector('[data-notifications]').addEventListener('click', () => {
  showToast('Demo mode · no live robot alerts are connected.');
});
document.querySelectorAll('[data-filter]').forEach((button) => {
  button.addEventListener('click', () => {
    document.querySelectorAll('[data-filter]').forEach((chip) => {
      const selected = chip === button;
      chip.classList.toggle('is-selected', selected);
      chip.setAttribute('aria-pressed', String(selected));
    });
    renderEvents(document.querySelector('#detection-events'), button.dataset.filter);
  });
});

renderEvents(document.querySelector('#overview-events'), 'all', 4);
renderEvents(document.querySelector('#detection-events'));
renderHistory();
updateEventCounts();
