(() => {
  'use strict';

  const cards = Array.from(document.querySelectorAll('.honour-card[data-memorial-locations]'));
  const filterButtons = Array.from(document.querySelectorAll('[data-honour-filter]'));
  const filterStatus = document.getElementById('honour-filter-status');
  const sections = Array.from(document.querySelectorAll('.honour-section'));
  let activeFilter = 'all';

  function cardMatches(card, filter) {
    if (filter === 'all') return true;
    const locations = (card.dataset.memorialLocations || '').split(/\s+/).filter(Boolean);
    return locations.includes(filter);
  }

  function updateSectionVisibility() {
    sections.forEach((section) => {
      const sectionCards = Array.from(section.querySelectorAll('.honour-card[data-memorial-locations]'));
      const hasVisibleCard = sectionCards.some((card) => !card.hidden);
      section.hidden = !hasVisibleCard;
    });
  }

  function updatePressedState(filter) {
    filterButtons.forEach((button) => {
      const isActive = button.dataset.honourFilter === filter;
      button.classList.toggle('is-active', isActive);
      button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });
  }

  function applyFilter(filter, options = {}) {
    if (!cards.length) return;
    const { announce = true } = options;
    activeFilter = filter;

    let visibleCount = 0;
    cards.forEach((card) => {
      const matches = cardMatches(card, filter);
      card.hidden = !matches;
      if (matches) visibleCount += 1;
    });

    updatePressedState(filter);
    updateSectionVisibility();

    if (filterStatus) {
      filterStatus.textContent = filter === 'all'
        ? `Showing all ${cards.length} profiles.`
        : `Showing ${visibleCount} of ${cards.length} profiles.`;
      if (!announce) filterStatus.setAttribute('aria-live', 'off');
      else filterStatus.setAttribute('aria-live', 'polite');
    }
  }

  function initialiseFilterCounts() {
    if (!cards.length || !filterButtons.length) return;

    filterButtons.forEach((button) => {
      const filter = button.dataset.honourFilter;
      const count = filter === 'all'
        ? cards.length
        : cards.filter((card) => cardMatches(card, filter)).length;
      const countNode = button.querySelector(`[data-honour-count="${filter}"]`);
      if (countNode) countNode.textContent = `(${count})`;

      // Do not show an empty filter, but leave the reference-system explanation visible.
      if (filter !== 'all' && count === 0) button.hidden = true;
    });

    filterButtons.forEach((button) => {
      button.addEventListener('click', () => {
        const filter = button.dataset.honourFilter || 'all';
        applyFilter(filter);
      });
    });

    applyFilter('all', { announce: false });
  }

  function ensureHashTargetVisible() {
    if (!window.location.hash) return;
    const rawId = window.location.hash.slice(1);
    let id = rawId;
    try {
      id = decodeURIComponent(rawId);
    } catch (_) {
      // Keep the raw fragment if decoding fails.
    }

    const target = document.getElementById(id);
    if (!target) return;

    const targetCard = target.classList.contains('honour-card') ? target : target.closest('.honour-card');
    const targetSection = target.classList.contains('honour-section') ? target : target.closest('.honour-section');
    const hiddenByFilter = (targetCard && targetCard.hidden) || (targetSection && targetSection.hidden);

    if (hiddenByFilter && activeFilter !== 'all') {
      applyFilter('all');
      if (filterStatus) filterStatus.textContent = `Filter cleared to show the linked profile. Showing all ${cards.length} profiles.`;
      window.requestAnimationFrame(() => {
        target.scrollIntoView({ block: 'start' });
      });
    }
  }

  initialiseFilterCounts();
  ensureHashTargetVisible();
  window.addEventListener('hashchange', ensureHashTargetVisible);

  const triggers = document.querySelectorAll('[data-honour-open]');
  const dialogs = document.querySelectorAll('.honour-dialog');
  if (!triggers.length || !dialogs.length) return;

  let lastTrigger = null;

  function closeDialog(dialog) {
    if (!dialog) return;
    if (typeof dialog.close === 'function' && dialog.open) {
      dialog.close();
    } else {
      dialog.removeAttribute('open');
      dialog.dispatchEvent(new Event('close'));
    }
  }

  function openDialog(trigger) {
    const id = trigger.getAttribute('data-honour-open');
    const dialog = id ? document.getElementById(id) : null;
    if (!dialog) return;

    lastTrigger = trigger;
    document.body.classList.add('honour-dialog-open');

    if (typeof dialog.showModal === 'function') {
      dialog.showModal();
    } else {
      dialog.setAttribute('open', '');
    }

    const closeButton = dialog.querySelector('[data-honour-close]');
    if (closeButton) closeButton.focus();
  }

  triggers.forEach((trigger) => {
    trigger.addEventListener('click', () => openDialog(trigger));
  });

  dialogs.forEach((dialog) => {
    dialog.querySelectorAll('[data-honour-close]').forEach((button) => {
      button.addEventListener('click', () => closeDialog(dialog));
    });

    dialog.addEventListener('click', (event) => {
      if (event.target === dialog) closeDialog(dialog);
    });

    dialog.addEventListener('cancel', () => {
      document.body.classList.remove('honour-dialog-open');
    });

    dialog.addEventListener('close', () => {
      document.body.classList.remove('honour-dialog-open');
      if (lastTrigger && document.contains(lastTrigger)) lastTrigger.focus();
      lastTrigger = null;
    });
  });

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    const openDialogElement = document.querySelector('.honour-dialog[open]');
    if (openDialogElement && typeof openDialogElement.close !== 'function') {
      closeDialog(openDialogElement);
    }
  });
})();
