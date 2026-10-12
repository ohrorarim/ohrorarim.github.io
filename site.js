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

    return `
      <article class="game-card">
        ${coverStart}
          <img class="game-cover" src="${image}" alt="${title} 대표 이미지" loading="lazy">
          <div class="cover-topline">
            <span class="game-number">${escapeHtml(game.number)}</span>
            <span class="platform-chip">${escapeHtml(game.platform)}</span>
          </div>
          <span class="cover-action" aria-hidden="true">${action}</span>
        ${coverEnd}
        <div class="game-info">
          <p class="game-kicker">${escapeHtml(game.kicker)}</p>
          <h3>${title}</h3>
          <p class="game-description">${escapeHtml(game.description)}</p>
          <div class="game-footer">
            <span class="game-platform">${escapeHtml(game.status)}</span>
            ${cta}
          </div>
        </div>
      </article>`;
  }

  if (grid) {
    grid.innerHTML = games.length
      ? games.map(createCard).join('')
      : '<p class="loading-message">등록된 게임이 아직 없어요. games.js에 게임을 추가해 주세요.</p>';
  }

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
    track.setAttribute('aria-label', '게임 프로젝트를 좌우로 둘러보세요.');

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
