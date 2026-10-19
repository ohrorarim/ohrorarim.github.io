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
    const revealDelay = Math.max(0, (Number(game.number) - 1) % 5) * 90;

    return `
      <article class="game-card reveal-up" data-category="${category}" data-project-id="${escapeHtml(game.id)}" style="--reveal-delay:${revealDelay}ms">
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
  let revealObserver = null;

  function currentCards() {
    return grid ? Array.from(grid.querySelectorAll('.game-card')) : [];
  }

  function observeRevealElements() {
    const revealElements = document.querySelectorAll('.reveal-up:not(.is-visible)');
    if (revealObserver) revealObserver.disconnect();

    if (!('IntersectionObserver' in window)) {
      document.querySelectorAll('.reveal-up').forEach((element) => element.classList.add('is-visible'));
      return;
    }

    revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -4% 0px' });

    revealElements.forEach((element) => revealObserver.observe(element));
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
    const card = cards[activeIndex];
    const targetLeft = card.offsetLeft - (grid.clientWidth - card.clientWidth) / 2;
    grid.scrollTo({ left: Math.max(0, targetLeft), behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
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

    filterButtons.forEach((button) => {
      const selected = button.dataset.filter === filter;
      button.classList.toggle('is-active', selected);
      button.setAttribute('aria-pressed', selected ? 'true' : 'false');
    });
    if (hint) {
      hint.innerHTML = filter === 'app'
        ? '일상에 도움이 되는 앱 프로젝트 <span aria-hidden="true">↔</span>'
        : filter === 'game'
          ? '플레이하며 즐기는 게임 프로젝트 <span aria-hidden="true">↔</span>'
          : '마우스 휠 또는 트랙패드로 둘러보세요 <span aria-hidden="true">↔</span>';
    }

    activeIndex = 0;
    grid.scrollLeft = 0;
    buildPagination();
    updateNavigation();
    grid.setAttribute('aria-label', filter === 'all' ? '전체 프로젝트 목록' : filter === 'game' ? '게임 프로젝트 목록' : '앱 프로젝트 목록');
    grid.setAttribute('tabindex', '0');
    observeRevealElements();
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
  observeRevealElements();

  /*
   * 프로젝트 카드 영역의 휠을 부드러운 가로 이동으로 바꿉니다.
   * 카드 영역 안에서는 세로 휠이 카드 이동에만 사용되고,
   * 카드 레일의 끝에서는 페이지 섹션 이동으로 자연스럽게 이어집니다.
   */
  let sectionTransitioning = false;

  function enableProjectHorizontalWheel() {
    const track = document.getElementById('game-grid');
    if (!track) return;

    track.setAttribute('tabindex', '0');
    track.setAttribute('aria-label', '프로젝트 목록을 좌우로 둘러보세요.');

    let wheelTarget = track.scrollLeft;
    let wheelFrame = 0;

    const getMaxScroll = () => Math.max(0, track.scrollWidth - track.clientWidth);
    const clampScroll = (value) => Math.max(0, Math.min(value, getMaxScroll()));

    function animateHorizontalScroll() {
      const difference = wheelTarget - track.scrollLeft;
      if (Math.abs(difference) <= 0.65) {
        track.scrollLeft = wheelTarget;
        wheelFrame = 0;
        return;
      }

      // 프레임 단위로 목표 위치에 가까워지게 해 연속 휠 입력도 부드럽게 합칩니다.
      track.scrollLeft += difference * 0.19;
      wheelFrame = requestAnimationFrame(animateHorizontalScroll);
    }

    track.addEventListener('scroll', () => {
      // 모바일 스와이프나 스크롤바 드래그가 끝나면 기준 위치를 동기화합니다.
      if (!wheelFrame) wheelTarget = track.scrollLeft;
    }, { passive: true });

    track.addEventListener('wheel', (event) => {
      if (event.ctrlKey || event.metaKey) return;
      if (sectionTransitioning) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }

      // 세로 휠을 가로 이동으로 사용하되, 트랙패드 가로 제스처도 보존합니다.
      const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY)
        ? event.deltaX
        : event.deltaY;
      if (Math.abs(delta) < 1) return;

      const maxScroll = getMaxScroll();
      if (maxScroll <= 1) return;

      const baseTarget = wheelFrame ? wheelTarget : track.scrollLeft;
      const movingTowardEdge = wheelFrame && Math.abs(wheelTarget - track.scrollLeft) > 1;
      const atRequestedEdge = delta < 0 ? baseTarget <= 1 : baseTarget >= maxScroll - 1;

      // 스크롤 애니메이션이 진행 중이면 같은 방향의 관성 입력으로 섹션이 갑자기 넘어가지 않게 합니다.
      if (atRequestedEdge) {
        if (movingTowardEdge) {
          event.preventDefault();
          event.stopPropagation();
        }
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      // 일반 휠 한 번에도 지나치게 조금 움직이지 않도록 하고, 여러 입력은 목표점에 누적합니다.
      wheelTarget = clampScroll(baseTarget + delta * 1.45);
      if (!wheelFrame) wheelFrame = requestAnimationFrame(animateHorizontalScroll);
    }, { passive: false });
  }

  /*
   * 페이지 바깥 영역의 휠은 섹션 단위로 부드럽게 이동합니다.
   * 프로젝트 카드 레일은 위의 핸들러가 먼저 처리하므로 여기에 도달하지 않습니다.
   */
  function enableSectionWheelNavigation() {
    const hero = document.querySelector('.hero');
    const projects = document.getElementById('games');
    const studio = document.getElementById('studio');
    const header = document.querySelector('.site-header');
    if (!hero || !projects || !studio) return;

    // 터치 화면은 자연스러운 세로 스크롤을 유지하고, 마우스/트랙패드에서 섹션 이동을 적용합니다.
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

    let unlockTimer = null;
    let riseTimer = null;
    let currentDestination = null;

    const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const headerHeight = () => header ? header.getBoundingClientRect().height : 0;
    const maxPageScroll = () => Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    const sectionTop = (element) => Math.max(0, Math.min(maxPageScroll(), element.getBoundingClientRect().top + window.scrollY - headerHeight()));
    const getStops = () => [
      { element: hero, top: sectionTop(hero), name: 'hero' },
      { element: projects, top: sectionTop(projects), name: 'projects' },
      { element: studio, top: sectionTop(studio), name: 'studio' }
    ].filter((stop, index, all) => index === 0 || Math.abs(stop.top - all[index - 1].top) > 2);

    function playProjectsRise() {
      if (!projects || prefersReducedMotion()) return;
      window.clearTimeout(riseTimer);
      projects.classList.remove('is-rising');
      // 같은 클래스를 다시 붙여도 CSS 애니메이션이 처음부터 재생되도록 프레임을 확정합니다.
      void projects.offsetWidth;
      projects.classList.add('is-rising');
      riseTimer = window.setTimeout(() => projects.classList.remove('is-rising'), 1150);
    }

    function scrollToSection(stop) {
      if (!stop || sectionTransitioning) return;
      sectionTransitioning = true;
      currentDestination = stop.name;
      window.clearTimeout(unlockTimer);
      window.clearTimeout(riseTimer);

      const top = Math.max(0, Math.min(maxPageScroll(), stop.top));
      window.scrollTo({ top, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });

      // OUR PROJECTS가 화면에 들어올 무렵부터 내용이 아래에서 위로 올라옵니다.
      if (stop.name === 'projects') {
        window.setTimeout(playProjectsRise, prefersReducedMotion() ? 0 : 460);
      }

      unlockTimer = window.setTimeout(() => {
        sectionTransitioning = false;
        currentDestination = null;
      }, prefersReducedMotion() ? 40 : 980);
    }

    window.addEventListener('wheel', (event) => {
      if (event.ctrlKey || event.metaKey || prefersReducedMotion()) return;
      // 트랙패드의 가로 제스처는 페이지 섹션 이동으로 해석하지 않습니다.
      if (Math.abs(event.deltaX) > Math.abs(event.deltaY) || Math.abs(event.deltaY) < 5) return;

      if (sectionTransitioning) {
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
      if (nextIndex < 0 || nextIndex >= stops.length) return;

      event.preventDefault();
      scrollToSection(stops[nextIndex]);
    }, { passive: false });

    // 메뉴와 CTA도 같은 섹션 이동 및 프로젝트 진입 애니메이션을 사용합니다.
    document.querySelectorAll('a[href="#top"], a[href="#games"], a[href="#studio"]').forEach((link) => {
      link.addEventListener('click', (event) => {
        const hash = link.getAttribute('href');
        const target = hash === '#top' ? hero : hash === '#games' ? projects : studio;
        if (!target) return;
        event.preventDefault();
        const name = target === hero ? 'hero' : target === projects ? 'projects' : 'studio';
        scrollToSection({ element: target, top: sectionTop(target), name });
        if (window.history && window.history.replaceState) window.history.replaceState(null, '', hash);
      });
    });
  }

  enableProjectHorizontalWheel();
  enableSectionWheelNavigation();
})();
