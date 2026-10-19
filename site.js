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
   * 게임 프로젝트 가로 휠
   * - 게임 섹션 위에서 세로 마우스 휠을 좌우 이동으로 전환합니다.
   * - 트랙패드의 가로 스크롤도 그대로 지원합니다.
   * - 콘텐츠 끝에서는 기본 페이지 스크롤을 허용합니다.
   */
  function enableProjectHorizontalWheel() {
    const section = document.getElementById('games');
    const track = document.getElementById('game-grid');
    if (!section || !track) return;

    // 키보드 사용자가 탭 이동 후 방향키로 목록을 탐색할 수 있게 합니다.
    track.setAttribute('tabindex', '0');
    track.setAttribute('aria-label', '프로젝트 목록을 좌우로 둘러보세요.');

    section.addEventListener('wheel', (event) => {
      // 브라우저 확대/축소 제스처는 가로 이동으로 바꾸지 않습니다.
      if (event.ctrlKey || event.metaKey) return;

      const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY)
        ? event.deltaX
        : event.deltaY;

      if (Math.abs(delta) < 1) return;

      const maxScroll = track.scrollWidth - track.clientWidth;
      if (maxScroll <= 1) return;

      const canMoveLeft = track.scrollLeft > 1;
      const canMoveRight = track.scrollLeft < maxScroll - 1;

      // 가로 목록의 끝에서는 이벤트를 가로채지 않고 페이지 스크롤을 유지합니다.
      if ((delta < 0 && !canMoveLeft) || (delta > 0 && !canMoveRight)) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      track.scrollLeft += delta;
    }, { passive: false });
  }

  /*
   * 페이지 섹션 이동 휠
   * - 메인 화면에서 아래로 휠을 돌리면 게임 프로젝트로 이동합니다.
   * - 게임 프로젝트 상단에서 위로 휠을 돌리면 메인 화면으로 돌아갑니다.
   * - 가로 갤러리가 스크롤을 처리하는 도중에는 위 핸들러가 개입하지 않습니다.
   */
  function enableHeroWheelNavigation() {
    const hero = document.querySelector('.hero');
    const gamesSection = document.getElementById('games');
    const header = document.querySelector('.site-header');
    if (!hero || !gamesSection) return;
    if (window.matchMedia('(max-width: 900px)').matches) return;

    let isAnimating = false;
    let animationTimer = null;

    const headerHeight = () => header ? header.getBoundingClientRect().height : 0;
    const documentTop = (element) => element.getBoundingClientRect().top + window.scrollY;

    function scrollToSection(section) {
      isAnimating = true;
      window.clearTimeout(animationTimer);
      const target = Math.max(0, documentTop(section) - headerHeight());
      window.scrollTo({ top: target, behavior: 'smooth' });

      // 트랙패드 휠 관성으로 여러 번 점프하는 것을 방지합니다.
      animationTimer = window.setTimeout(() => {
        isAnimating = false;
      }, 1050);
    }

    window.addEventListener('wheel', (event) => {
      if (event.ctrlKey || event.metaKey) return;
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      if (Math.abs(event.deltaY) < Math.abs(event.deltaX) || Math.abs(event.deltaY) < 2) return;

      if (isAnimating) {
        event.preventDefault();
        return;
      }

      const headerH = headerHeight();
      const heroRect = hero.getBoundingClientRect();
      const gamesRect = gamesSection.getBoundingClientRect();

      if (event.deltaY > 0) {
        // 메인 화면이 보이는 동안 아래로 휠을 돌리면 프로젝트를 엽니다.
        const heroIsVisible = heroRect.bottom > headerH + 40 && heroRect.top < window.innerHeight;
        if (heroIsVisible) {
          event.preventDefault();
          scrollToSection(gamesSection);
        }
        return;
      }

      if (event.deltaY < 0) {
        // 프로젝트 섹션 상단에서 위로 휠을 돌릴 때만 메인으로 돌아갑니다.
        const projectsAtTop = Math.abs(gamesRect.top - headerH) < 110;
        if (projectsAtTop) {
          event.preventDefault();
          scrollToSection(hero);
        }
      }
    }, { passive: false });
  }

  enableProjectHorizontalWheel();
  enableHeroWheelNavigation();
})();
