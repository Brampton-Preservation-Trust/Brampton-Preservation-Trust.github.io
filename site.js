(() => {
  'use strict';

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let scrollObserver = null;

  function initReveal() {
    const items = document.querySelectorAll('.reveal');
    if (reducedMotion || !('IntersectionObserver' in window)) {
      items.forEach((el) => el.classList.add('visible'));
      return;
    }
    scrollObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          scrollObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    items.forEach((el) => scrollObserver.observe(el));
  }

  function observeRevealItems(root) {
    root.querySelectorAll('.reveal').forEach((el) => {
      if (scrollObserver) scrollObserver.observe(el);
      else el.classList.add('visible');
    });
  }

  function initNavigation() {
    const navToggle = document.querySelector('.nav-toggle');
    const navLinks = document.querySelector('.nav-links');
    if (!navToggle || !navLinks) return;

    const closeMenu = () => {
      navLinks.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
      navToggle.setAttribute('aria-label', 'Open menu');
    };

    navToggle.setAttribute('aria-label', 'Open menu');
    navToggle.addEventListener('click', () => {
      const isOpen = navLinks.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', String(isOpen));
      navToggle.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
    });
    navLinks.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && navLinks.classList.contains('open')) {
        closeMenu();
        navToggle.focus();
      }
    });
  }

  function initHistoryTimeline() {
    const timeline = document.getElementById('history-timeline');
    const toggle = document.querySelector('.timeline-toggle');
    if (!timeline || !toggle) return;

    const secondaryItems = Array.from(timeline.querySelectorAll('.timeline-secondary'));
    if (!secondaryItems.length) return;

    timeline.classList.add('timeline-enhanced');
    secondaryItems.forEach((item) => {
      item.setAttribute('aria-hidden', 'true');
      item.style.maxHeight = '0px';
    });
    toggle.hidden = false;

    const setExpanded = (expanded) => {
      timeline.classList.toggle('timeline-expanded', expanded);
      toggle.setAttribute('aria-expanded', String(expanded));
      toggle.textContent = expanded ? 'Show key milestones only' : 'Show full timeline';

      secondaryItems.forEach((item) => {
        item.setAttribute('aria-hidden', String(!expanded));
        if (expanded) {
          item.style.maxHeight = `${item.scrollHeight + 48}px`;
        } else {
          item.style.maxHeight = '0px';
        }
      });
    };

    toggle.addEventListener('click', () => {
      const expanded = toggle.getAttribute('aria-expanded') === 'true';
      setExpanded(!expanded);
    });

    window.addEventListener('resize', () => {
      if (toggle.getAttribute('aria-expanded') !== 'true') return;
      secondaryItems.forEach((item) => {
        item.style.maxHeight = `${item.scrollHeight + 48}px`;
      });
    });
  }

  function localDate(dateString) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateString || '');
    if (!match) return new Date(dateString);
    return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  }

  function eventNode(event) {
    const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const date = localDate(event.date);
    const item = document.createElement('article');
    item.className = 'event-item reveal';

    const dateBlock = document.createElement('div');
    dateBlock.className = 'event-date-block';
    const day = document.createElement('span');
    day.className = 'day';
    day.textContent = String(date.getDate());
    const month = document.createElement('span');
    month.className = 'month';
    month.textContent = MONTHS[date.getMonth()] || '';
    dateBlock.append(day, month);

    const body = document.createElement('div');
    body.className = 'event-body';
    const meta = document.createElement('div');
    meta.className = 'event-meta';
    meta.textContent = `${event.time || 'All day'} · ${event.location || 'Brampton Old Church'}`;
    const title = document.createElement('h3');
    const titleText = String(event.title || 'Event');
    if (event.url) {
      try {
        const resolvedUrl = new URL(String(event.url), window.location.href);
        if (['http:', 'https:'].includes(resolvedUrl.protocol)) {
          const titleLink = document.createElement('a');
          titleLink.href = String(event.url);
          titleLink.textContent = titleText;
          title.append(titleLink);
        } else {
          title.textContent = titleText;
        }
      } catch {
        title.textContent = titleText;
      }
    } else {
      title.textContent = titleText;
    }
    body.append(meta, title);
    if (event.description) {
      const description = document.createElement('p');
      description.textContent = event.description;
      body.append(description);
    }
    if (Array.isArray(event.links) && event.links.length) {
      const links = document.createElement('div');
      links.className = 'event-links';
      event.links.forEach((eventLink) => {
        if (!eventLink || !eventLink.label || !eventLink.url) return;
        let resolvedUrl;
        try {
          resolvedUrl = new URL(String(eventLink.url), window.location.href);
        } catch {
          return;
        }
        if (!['http:', 'https:'].includes(resolvedUrl.protocol)) return;
        const link = document.createElement('a');
        link.href = String(eventLink.url);
        link.textContent = String(eventLink.label);
        links.append(link);
      });
      if (links.childElementCount) body.append(links);
    }
    item.append(dateBlock, body);
    return item;
  }

  async function loadEvents() {
    const list = document.getElementById('events-list');
    if (!list) return;
    try {
      const response = await fetch('events.json', { credentials: 'same-origin' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const events = await response.json();
      if (!Array.isArray(events)) throw new Error('Events data must be an array');

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const upcoming = events
        .filter((event) => event && event.date && localDate(event.date) >= today)
        .sort((a, b) => localDate(a.date) - localDate(b.date));

      list.replaceChildren();
      if (!upcoming.length) {
        const message = document.createElement('p');
        message.className = 'events-empty';
        message.innerHTML = 'No upcoming events at present. Please check back soon, or <a href="governance.html#contact">contact the Secretary</a> for more information.';
        list.append(message);
      } else {
        upcoming.forEach((event) => list.append(eventNode(event)));
        observeRevealItems(list);
      }
    } catch (error) {
      const message = document.createElement('p');
      message.className = 'events-empty';
      message.innerHTML = 'Events could not be loaded. Please <a href="governance.html#contact">contact the Secretary</a> for the latest programme.';
      list.replaceChildren(message);
      console.error('Could not load events from events.json:', error);
    } finally {
      list.setAttribute('aria-busy', 'false');
    }
  }

  async function loadHeroImage() {
    const hero = document.getElementById('hero');
    if (!hero) return;
    try {
      const response = await fetch('hero-images.json', { credentials: 'same-origin' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const images = await response.json();
      if (!Array.isArray(images)) return;
      const month = new Date().getMonth() + 1;
      const match = images.find((image) => {
        if (!image || !image.start_month || !image.end_month) return false;
        return image.start_month <= image.end_month
          ? month >= image.start_month && month <= image.end_month
          : month >= image.start_month || month <= image.end_month;
      });
      if (!match || !match.file) return;

      // The same seasonal file is selected in <head> before CSS loads, avoiding a
      // preloaded default image followed by a second seasonal image download.
      document.documentElement.style.setProperty(
        '--hero-image',
        `url("${String(match.file).replace(/["\\]/g, '')}")`
      );

      const credit = document.querySelector('.hero-photo-credit');
      if (!credit) return;
      credit.replaceChildren();

      if (match.title && match.title_url) {
        const titleLink = document.createElement('a');
        titleLink.href = match.title_url;
        titleLink.target = '_blank';
        titleLink.rel = 'noopener noreferrer';
        titleLink.textContent = match.title;
        credit.append('“', titleLink, '”');
      } else if (match.title) {
        credit.append(`“${match.title}”`);
      }

      if (match.author && match.author_url) {
        const authorLink = document.createElement('a');
        authorLink.href = match.author_url;
        authorLink.target = '_blank';
        authorLink.rel = 'noopener noreferrer';
        authorLink.textContent = match.author;
        credit.append(' by ', authorLink);
      } else if (match.author) {
        credit.append(` by ${match.author}`);
      }

      if (match.license && match.license_url) {
        const licenseLink = document.createElement('a');
        licenseLink.href = match.license_url;
        licenseLink.target = '_blank';
        licenseLink.rel = 'noopener noreferrer license';
        licenseLink.textContent = match.license;
        credit.append(', ', licenseLink);
      } else if (match.license) {
        credit.append(`, ${match.license}`);
      }
    } catch (error) {
      console.info('Using the default hero image and credit.', error);
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    initReveal();
    initNavigation();
    initHistoryTimeline();
    const year = document.getElementById('yr');
    if (year) year.textContent = String(new Date().getFullYear());
    loadEvents();
    loadHeroImage();
  });
})();
