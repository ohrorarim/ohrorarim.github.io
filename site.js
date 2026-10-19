(function () {
  'use strict';

  const config = window.STUDIO_CONFIG || { name: '작은 게임 작업실' };
  const games = Array.isArray(window.GAMES) ? window.GAMES : [];
  const grid = document.getElementById('game-grid');

  document.title = `${config.name} — Indie Game Studio`;
  document.querySelectorAll('#brand-name, #footer-brand-name, #footer-studio-name')
    .forEach((element) => { element.textContent = config.name; });

  const currentYear = document.getElementById('current-year');
  if (currentYear) currentYear.textContent = new Date().getFullYear();

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, (character) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[character]);
  }

  function createCard(game) {
    const hasLink = typeof game.storeUrl === 'string' && game.storeUrl.trim().length > 0;
    const safeUrl = hasLink ? escapeHtml(game.storeUrl.trim()) : '';
    const title = escapeHtml(game.title);
    const image = escapeHtml(game.image);
    const action = hasLink ? '↗' : '＋';
    const coverStart = hasLink
      ? `<a class="game-cover-link" href="${safeUrl}" target="_blank" rel="noopener noreferrer" aria-label="${title} 다운로드 페이지 열기">`
      : `<div class="game-cover-link" aria-label="${title} ${escapeHtml(game.status)}">`;
    const coverEnd = hasLink ? '</a>' : '</div>';
    const ctaClass = hasLink ? 'game-cta' : 'game-cta muted';
    const cta = hasLink
      ? `<a class="${ctaClass}" href="${safeUrl}" target="_blank" rel="noopener noreferrer">${escapeHtml(game.linkLabel || '스토어에서 보기')} ↗</a>`
      : `<span class="${ctaClass}">${escapeHtml(game.linkLabel || game.status)}</span>`;

    const category = game.category === 'app' ? 'app' : 'game';
    const categoryLabel = category === 'app' ? '앱' : '게임';

    return `
      <article class="game-card" data-category="${category}" data-project-id="${escapeHtml(game.id)}">
        ${coverStart}
          <img class="game-cover" src="${image}" alt="${title} 대표 이미지" loading="lazy">
          <div class="cover-topline">
            <span class="game-number">${escapeHtml(game.number)}</span>
            <span class="platform-chip">${escapeHtml(game.platform)}</span>
          </div>
          <span class="cover-action" aria-hidden="true">${action}</span>
        ${coverEnd}
        <div class="game-info">
          <div class="game-meta-line">
            <span class="project-type-tag ${category}">${categoryLabel}</span>
            <p class="game-kicker">${escapeHtml(game.kicker)}</p>
          </div>
          <h3>${title}</h3>
          <p class="game-description">${escapeHtml(game.description)}</p>
          <div class="game-footer">
            <span class="game-platform">${escapeHtml(game.status)}</span>
            ${cta}
          </div>
        </div>
      </article>`;
  }

  const filterButtons = Array.from(document.querySelectorAll('[data-filter]'));
  const pagination = document.getElementById('project-pagination');
  const counter = document.getElementById('project-count');
  const previousButton = document.querySelector('[data-direction="prev"]');
  const nextButton = document.querySelector('[data-direction="next"]');
  const hint = document.getElementById('project-hint');
  let activeFilter = 'all';
  let activeIndex = 0;
  let scrollFrame = 0;
  let wheelTarget = 0;
  let wheelFrame = 0;
  let projectCardObserver = null;

  function currentCards() {
    return grid ? Array.from(grid.querySelectorAll('.game-card')) : [];
  }

  function resetProjectWheelState() {
    if (wheelFrame) cancelAnimationFrame(wheelFrame);
    if (scrollFrame) cancelAnimationFrame(scrollFrame);
    wheelFrame = 0;
    scrollFrame = 0;
    wheelTarget = 0;
    if (grid) grid.scrollLeft = 0;
  }

  function indexNearestToCenter() {
    const cards = currentCards();
    if (!cards.length || !grid) return 0;
    const trackCenter = grid.getBoundingClientRect().left + grid.clientWidth / 2;
    let nearestIndex = 0;
    let nearestDistance = Infinity;
    cards.forEach((card, index) => {
      const rect = card.getBoundingClientRect();
      const distance = Math.abs((rect.left + rect.width / 2) - trackCenter);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = index;
      }
    });
    return nearestIndex;
  }

  function updateNavigation() {
    const cards = currentCards();
    const count = cards.length;
    activeIndex = count ? Math.min(Math.max(activeIndex, 0), count - 1) : 0;

    if (counter) {
      const current = String(count ? activeIndex + 1 : 0).padStart(2, '0');
      const total = String(count).padStart(2, '0');
      counter.innerHTML = `${current} <span>/</span> ${total}`;
    }
    if (previousButton) previousButton.disabled = count < 2 || activeIndex === 0;
    if (nextButton) nextButton.disabled = count < 2 || activeIndex >= count - 1;
    if (pagination) {
      Array.from(pagination.children).forEach((button, index) => {
        const isCurrent = index === activeIndex;
        button.setAttribute('aria-current', isCurrent ? 'true' : 'false');
        button.setAttribute('aria-label', `프로젝트 ${index + 1}: ${cards[index]?.querySelector('h3')?.textContent || ''}`);
      });
    }
  }

  function buildPagination() {
    if (!pagination) return;
    const cards = currentCards();
    pagination.innerHTML = cards.map((card, index) => `
      <button class="pagination-dot" type="button" data-page="${index}" aria-current="${index === activeIndex ? 'true' : 'false'}" aria-label="프로젝트 ${index + 1}: ${escapeHtml(card.querySelector('h3')?.textContent || '')}"></button>
    `).join('');
    pagination.querySelectorAll('[data-page]').forEach((button) => {
      button.addEventListener('click', () => goToProject(Number(button.dataset.page)));
    });
  }

  function goToProject(index) {
    const cards = currentCards();
    if (!cards.length || !grid) return;
    activeIndex = Math.max(0, Math.min(index, cards.length - 1));
    // 화살표/페이지 점프를 누르면 진행 중인 휠 애니메이션과 경합하지 않게 중단합니다.
    if (wheelFrame) cancelAnimationFrame(wheelFrame);
    wheelFrame = 0;
    wheelTarget = grid.scrollLeft;
    const card = cards[activeIndex];
    const gridRect = grid.getBoundingClientRect();
    const cardRect = card.getBoundingClientRect();
    const targetLeft = grid.scrollLeft + cardRect.left - gridRect.left - (grid.clientWidth - card.clientWidth) / 2;
    grid.scrollTo({ left: Math.max(0, Math.min(grid.scrollWidth - grid.clientWidth, targetLeft)), behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    updateNavigation();
  }

  function updateFilterCounts() {
    const counts = {
      all: games.length,
      game: games.filter((game) => (game.category || 'game') === 'game').length,
      app: games.filter((game) => game.category === 'app').length
    };
    document.querySelectorAll('[data-filter-count]').forEach((element) => {
      const count = counts[element.dataset.filterCount] || 0;
      element.textContent = String(count).padStart(2, '0');
    });
  }

  function renderProjects(filter = activeFilter) {
    if (!grid) return;
    activeFilter = filter;
    const filteredGames = games.filter((game) => filter === 'all' || (game.category || 'game') === filter);
    grid.innerHTML = filteredGames.length
      ? filteredGames.map(createCard).join('')
      : '<p class="loading-message">이 분류에 등록된 프로젝트가 아직 없어요.</p>';
    // 필터로 카드 수가 달라지면 이전 가로 스크롤 목표값과 애니메이션을 초기화합니다.
    resetProjectWheelState();

    filterButtons.forEach((button) => {
      const selected = button.dataset.filter === filter;
      button.classList.toggle('is-active', selected);
      button.setAttribute('aria-pressed', selected ? 'true' : 'false');
    });
    if (hint) {
      hint.innerHTML = '휠을 움직여 프로젝트 둘러보기 <span aria-hidden="true">↔</span>';
    }

    activeIndex = 0;
    buildPagination();
    updateNavigation();
    grid.setAttribute('aria-label', filter === 'all' ? '전체 프로젝트 목록' : filter === 'game' ? '게임 프로젝트 목록' : '앱 프로젝트 목록');
    grid.setAttribute('tabindex', '0');
    setupProjectCardReveal();
  }

  filterButtons.forEach((button) => {
    button.addEventListener('click', () => renderProjects(button.dataset.filter));
  });

  if (previousButton) previousButton.addEventListener('click', () => goToProject(activeIndex - 1));
  if (nextButton) nextButton.addEventListener('click', () => goToProject(activeIndex + 1));

  if (grid) {
    grid.addEventListener('scroll', () => {
      if (scrollFrame) cancelAnimationFrame(scrollFrame);
      scrollFrame = requestAnimationFrame(() => {
        activeIndex = indexNearestToCenter();
        updateNavigation();
      });
    }, { passive: true });

    grid.addEventListener('keydown', (event) => {
      if (event.target !== grid) return;
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        goToProject(activeIndex + 1);
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        goToProject(activeIndex - 1);
      }
    });
  }

  updateFilterCounts();
  renderProjects('all');

  /*
   * 카드 하나씩 아래에서 자연스럽게 올라오게 합니다.
   * 한 번 등장한 카드는 다시 스크롤해도 재생/깜빡임이 반복되지 않습니다.
   */
  function setupProjectCardReveal() {
    const cards = currentCards();
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (projectCardObserver) {
      projectCardObserver.disconnect();
      projectCardObserver = null;
    }

    if (reducedMotion || !('IntersectionObserver' in window)) {
      document.body.classList.remove('project-card-reveal-ready');
      cards.forEach((card) => card.classList.add('is-in-view'));
      return;
    }

    document.body.classList.add('project-card-reveal-ready');
    projectCardObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in-view');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -3% 0px' });

    cards.forEach((card, index) => {
      card.style.setProperty('--reveal-delay', `${Math.min(index, 4) * 75}ms`);
      card.classList.remove('is-in-view');
      projectCardObserver.observe(card);
    });
  }

  /*
   * 카드 레일의 휠 입력은 언제나 가로 이동으로 처리합니다.
   * 첫/마지막 카드에서도 세로 페이지 이동으로 넘기지 않습니다.
   * 카드 크기나 필터가 바뀔 때마다 scrollWidth/clientWidth를 다시 읽습니다.
   */
  function enableProjectHorizontalWheel() {
    const track = document.getElementById('game-grid');
    if (!track) return;

    track.setAttribute('tabindex', '0');
    const getMaxScroll = () => Math.max(0, track.scrollWidth - track.clientWidth);
    const clampScroll = (value) => Math.max(0, Math.min(value, getMaxScroll()));

    function syncTrackMetrics() {
      const maxScroll = getMaxScroll();
      track.scrollLeft = Math.max(0, Math.min(track.scrollLeft, maxScroll));
      wheelTarget = Math.max(0, Math.min(wheelFrame ? wheelTarget : track.scrollLeft, maxScroll));
      updateNavigation();
    }

    function animateHorizontalScroll() {
      wheelTarget = clampScroll(wheelTarget);
      const difference = wheelTarget - track.scrollLeft;
      if (Math.abs(difference) <= 0.8) {
        track.scrollLeft = wheelTarget;
        wheelFrame = 0;
        return;
      }
      track.scrollLeft += difference * 0.19;
      wheelFrame = requestAnimationFrame(animateHorizontalScroll);
    }

    track.addEventListener('scroll', () => {
      if (!wheelFrame) wheelTarget = clampScroll(track.scrollLeft);
    }, { passive: true });

    track.addEventListener('wheel', (event) => {
      if (event.ctrlKey || event.metaKey) return;
      const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
      if (Math.abs(delta) < 1) return;

      // 가장자리 포함, 모든 카드 영역 휠 입력이 페이지 섹션 이동으로 전파되지 않게 합니다.
      event.preventDefault();
      event.stopPropagation();
      const maxScroll = getMaxScroll();
      if (maxScroll <= 1) {
        wheelTarget = track.scrollLeft;
        return;
      }

      const baseTarget = wheelFrame ? wheelTarget : track.scrollLeft;
      wheelTarget = clampScroll(baseTarget + delta * 1.35);
      if (!wheelFrame && Math.abs(wheelTarget - track.scrollLeft) > 0.8) {
        wheelFrame = requestAnimationFrame(animateHorizontalScroll);
      }
    }, { passive: false });

    // 카드 목록 재렌더링/반응형 크기 변경을 모두 감지합니다.
    if ('ResizeObserver' in window) {
      const resizeObserver = new ResizeObserver(syncTrackMetrics);
      const observedCards = new Set();
      const observeCurrentCards = () => {
        const now = new Set(currentCards());
        observedCards.forEach((card) => {
          if (!now.has(card)) {
            resizeObserver.unobserve(card);
            observedCards.delete(card);
          }
        });
        now.forEach((card) => {
          if (!observedCards.has(card)) {
            resizeObserver.observe(card);
            observedCards.add(card);
          }
        });
        resizeObserver.observe(track);
        requestAnimationFrame(syncTrackMetrics);
      };
      const mutationObserver = new MutationObserver(observeCurrentCards);
      mutationObserver.observe(track, { childList: true });
      observeCurrentCards();
    } else {
      window.addEventListener('resize', syncTrackMetrics, { passive: true });
      requestAnimationFrame(syncTrackMetrics);
    }
  }

  /*
   * 카드 레일 밖에서만 휠 한 번에 인접 섹션으로 이동합니다.
   * 프로젝트 카드 레일과 페이지 전환의 잠금 상태를 서로 독립시켜
   * 카드 스크롤이 페이지 스크롤 잠금에 막히지 않게 합니다.
   */
  function enableSectionWheelNavigation() {
    const hero = document.querySelector('.hero');
    const projects = document.getElementById('games');
    const studio = document.getElementById('studio');
    const header = document.querySelector('.site-header');
    if (!hero || !projects || !studio) return;
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

    let pageTransitioning = false;
    let unlockTimer = 0;
    const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const headerHeight = () => header ? header.getBoundingClientRect().height : 0;
    const maxPageScroll = () => Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    const sectionTop = (element) => Math.max(
      0,
      Math.min(maxPageScroll(), element.getBoundingClientRect().top + window.scrollY - headerHeight())
    );
    const getStops = () => [
      { element: hero, top: sectionTop(hero), name: 'hero' },
      { element: projects, top: sectionTop(projects), name: 'projects' },
      { element: studio, top: sectionTop(studio), name: 'studio' }
    ].filter((stop, index, all) => index === 0 || Math.abs(stop.top - all[index - 1].top) > 2);

    function scrollToSection(stop, force = false) {
      if (!stop) return;
      if (pageTransitioning && !force) return;
      pageTransitioning = true;
      window.clearTimeout(unlockTimer);
      window.scrollTo({ top: stop.top, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
      unlockTimer = window.setTimeout(() => { pageTransitioning = false; }, prefersReducedMotion() ? 80 : 950);
    }

    window.addEventListener('wheel', (event) => {
      if (event.ctrlKey || event.metaKey || Math.abs(event.deltaY) < 8) return;
      // 레일 내부 이벤트는 가로 휠 핸들러에 맡깁니다.
      if (event.target instanceof Element && event.target.closest('.game-grid')) return;
      // 트랙패드의 좌우 제스처는 세로 섹션 이동이 아닙니다.
      if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;

      if (pageTransitioning) {
        event.preventDefault();
        return;
      }

      const stops = getStops();
      if (stops.length < 2) return;
      let nearestIndex = 0;
      let nearestDistance = Infinity;
      stops.forEach((stop, index) => {
        const distance = Math.abs(window.scrollY - stop.top);
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestIndex = index;
        }
      });

      const nextIndex = event.deltaY > 0 ? nearestIndex + 1 : nearestIndex - 1;
      // 페이지의 첫/마지막 경계에서는 브라우저 기본 스크롤을 막지 않습니다.
      if (nextIndex < 0 || nextIndex >= stops.length) return;
      event.preventDefault();
      scrollToSection(stops[nextIndex]);
    }, { passive: false, capture: true });

    // 헤더 링크/CTA는 잠금 중이어도 클릭한 목적지로 이동할 수 있습니다.
    document.querySelectorAll('a[href="#top"], a[href="#games"], a[href="#studio"]').forEach((link) => {
      link.addEventListener('click', (event) => {
        const hash = link.getAttribute('href');
        const target = hash === '#top' ? hero : hash === '#games' ? projects : studio;
        if (!target) return;
        event.preventDefault();
        scrollToSection({ element: target, top: sectionTop(target), name: hash.slice(1) }, true);
        if (window.history && window.history.replaceState) window.history.replaceState(null, '', hash);
      });
    });
  }

  enableProjectHorizontalWheel();
  enableSectionWheelNavigation();
})();
