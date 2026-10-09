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
   * Mouse-wheel navigation:
   * - A downward wheel gesture while the hero is visible moves smoothly to Projects.
   * - An upward gesture near the top of Projects returns smoothly to the hero.
   * - Scrolling inside the project list and the rest of the page remains native.
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

      // Keeps trackpad/wheel inertia from triggering multiple jumps.
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
        // While the hero is the visible section, one wheel gesture opens Projects.
        const heroIsVisible = heroRect.bottom > headerH + 40 && heroRect.top < window.innerHeight;
        if (heroIsVisible) {
          event.preventDefault();
          scrollToSection(gamesSection);
        }
        return;
      }

      if (event.deltaY < 0) {
        // Return to the hero only when the Projects section is near its top.
        const projectsAtTop = Math.abs(gamesRect.top - headerH) < 110;
        if (projectsAtTop) {
          event.preventDefault();
          scrollToSection(hero);
        }
      }
    }, { passive: false });
  }

  enableHeroWheelNavigation();
})();
