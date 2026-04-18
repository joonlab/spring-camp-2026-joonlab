#!/usr/bin/env node
/*
 * 29개 슬라이드 썸네일 PNG + PDF 생성
 *
 * 출력:
 *   thumbnails/full/slide-NN.png  (1920x1080)
 *   thumbnails/slide-NN.png       (960x540, retina 2배)
 *   public/spring-camp-2026-deck.pdf
 */
const path = require('path');
const fs = require('fs');
const { execFileSync } = require('child_process');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const DECK_URL = 'file://' + path.join(PROJECT_ROOT, 'deck', 'index.html');
const FULL_DIR = path.join(PROJECT_ROOT, 'thumbnails', 'full');
const THUMB_DIR = path.join(PROJECT_ROOT, 'thumbnails');
const PDF_PATH = path.join(PROJECT_ROOT, 'public', 'spring-camp-2026-deck.pdf');

// slides/node_modules 의 playwright-chromium 재사용
const PLAYWRIGHT_DIR = path.resolve(PROJECT_ROOT, '..', 'slides', 'node_modules', 'playwright-chromium');
const { chromium } = require(PLAYWRIGHT_DIR);

function pad2(n) { return String(n).padStart(2, '0'); }

(async () => {
  console.log('[capture] Launching chromium...');
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();

  console.log('[capture] Navigating to', DECK_URL);
  await page.goto(DECK_URL, { waitUntil: 'networkidle' });

  // 웹폰트 로딩 대기
  await page.evaluate(() => document.fonts && document.fonts.ready);
  await page.waitForTimeout(600);

  // 슬라이드 개수 확인
  const total = await page.evaluate(() => {
    const stage = document.querySelector('deck-stage');
    return stage ? stage.length : 0;
  });
  console.log('[capture] total slides:', total);
  if (total === 0) throw new Error('No slides detected');

  // 각 슬라이드를 돌면서 캡처
  for (let i = 0; i < total; i++) {
    await page.evaluate((idx) => {
      const stage = document.querySelector('deck-stage');
      stage.goTo(idx);
      // overlay 숨기기: 포커스 이동하여 마우스 idle 상태로 만듦
      const ov = stage.shadowRoot && stage.shadowRoot.querySelector('.overlay');
      if (ov) ov.removeAttribute('data-visible');
    }, i);

    // 슬라이드 전환 및 렌더 대기
    await page.waitForTimeout(250);

    const num = pad2(i + 1);
    const fullPath = path.join(FULL_DIR, `slide-${num}.png`);
    await page.screenshot({ path: fullPath, type: 'png', fullPage: false, clip: { x: 0, y: 0, width: 1920, height: 1080 } });
    console.log(`[capture] ${num}/${pad2(total)} saved ${fullPath}`);
  }

  // PDF 생성: 인쇄 레이아웃이 슬라이드당 한 페이지로 paginate되도록 @media print가 준비됨
  console.log('[capture] Generating PDF...');
  await page.emulateMedia({ media: 'print' });
  // 디자인 사이즈 그대로 (1920x1080 per page)
  await page.pdf({
    path: PDF_PATH,
    width: '1920px',
    height: '1080px',
    printBackground: true,
    preferCSSPageSize: true,
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
  });
  console.log('[capture] PDF saved', PDF_PATH);

  await browser.close();

  // 960x540 리사이즈 (sips)
  console.log('[capture] Resizing thumbnails with sips...');
  for (let i = 0; i < total; i++) {
    const num = pad2(i + 1);
    const src = path.join(FULL_DIR, `slide-${num}.png`);
    const dst = path.join(THUMB_DIR, `slide-${num}.png`);
    execFileSync('sips', ['-z', '540', '960', src, '--out', dst], { stdio: 'pipe' });
  }
  console.log('[capture] Done.');
})().catch((err) => {
  console.error('[capture] ERROR:', err);
  process.exit(1);
});
