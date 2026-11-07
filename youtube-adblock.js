// ==UserScript==
// @name         YouTube Ad Helper
// @namespace    local.youtube.adhelper
// @version      1.0
// @description  Skips video ads, removes ad elements, injects cosmetic CSS
// @match        https://www.youtube.com/*
// @match        https://m.youtube.com/*
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  // 1) Cosmetic CSS (same selectors as youtube-adblock.css)
  const HIDE_SELECTORS = [
    '#player-ads', '#masthead-ad', '.video-ads', '.ytp-ad-module',
    '.ytp-ad-overlay-container', '.ytp-ad-image-overlay', '.ytp-ad-text-overlay',
    'ytd-ad-slot-renderer', 'ytd-in-feed-ad-layout-renderer',
    'ytd-banner-promo-renderer', 'ytd-statement-banner-renderer',
    'ytd-display-ad-renderer', 'ytd-promoted-sparkles-web-renderer',
    'ytd-promoted-video-renderer', 'ytd-companion-slot-renderer',
    'ytd-action-companion-ad-renderer', 'ytd-brand-video-singleton-renderer',
    'ytd-rich-item-renderer:has(ytd-ad-slot-renderer)',
  ];

  const style = document.createElement('style');
  style.textContent = HIDE_SELECTORS.join(',\n') + ' { display: none !important; }';
  document.documentElement.appendChild(style);

  // 2) Video ad handling
  const SKIP_BUTTONS = [
    '.ytp-skip-ad-button',
    '.ytp-ad-skip-button',
    '.ytp-ad-skip-button-modern',
    '.ytp-ad-overlay-close-button',
  ];

  function handleVideoAd() {
    const player = document.querySelector('#movie_player');
    const video = document.querySelector('video.html5-main-video');
    if (!player || !video) return;

    const adShowing = player.classList.contains('ad-showing') ||
                      document.querySelector('.ad-showing, .ytp-ad-player-overlay');

    if (adShowing) {
      // Mute and speed through the ad
      video.muted = true;
      video.playbackRate = 16;
      if (isFinite(video.duration) && video.duration > 0) {
        try { video.currentTime = video.duration - 0.1; } catch (e) {}
      }
      // Click any skip button that appears
      for (const sel of SKIP_BUTTONS) {
        const btn = document.querySelector(sel);
        if (btn) btn.click();
      }
    } else if (video.playbackRate === 16) {
      // Restore normal state after the ad
      video.playbackRate = 1;
      video.muted = false;
    }
  }

  // 3) Remove ad nodes injected into the feed/page
  function removeAdNodes() {
    document
      .querySelectorAll('ytd-ad-slot-renderer, ytd-in-feed-ad-layout-renderer, ytd-promoted-sparkles-web-renderer')
      .forEach((el) => {
        const parent = el.closest('ytd-rich-item-renderer') || el;
        parent.remove();
      });
  }

  // Run on DOM changes (throttled) plus a light interval as a fallback
  let scheduled = false;
  function schedule() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      handleVideoAd();
      removeAdNodes();
    });
  }

  new MutationObserver(schedule).observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['class'],
  });

  setInterval(schedule, 500);
  schedule();
})();
