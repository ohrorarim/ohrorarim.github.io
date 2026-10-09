(function () {
  'use strict';

  const config = window.STUDIO_CONFIG || { name: '작은 게임 작업실' };
  const games = Array.isArray(window.GAMES) ? window.GAMES : [];
  const grid = document.getElementById('game-grid');

  document.title = `${config.name} — Indie Game Studio`;
  document.querySelectorAll('#brand-name, #footer-brand-name, #footer-studio-name')
    .forEach((element) => { element.textContent = config.name; });
  document.getElementById('current-year').textContent = new Date().getFullYear();

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
})();
