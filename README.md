# spring-camp-2026-joonlab

2026 지식관리 스프링캠프 · Session 08 · 박준 (JoonLab)

**맥락을 설계하는 개발자 — 기록이 일하게 만드는 법**

## 데모

- **Live**: https://spring-camp-2026-joonlab.vercel.app
- 홈 (썸네일 그리드): `/`
- 뷰어 (개별 슬라이드): `/viewer.html?slide=1`
- PDF 다운로드: `/public/spring-camp-2026-deck.pdf`

## 구조

```
.
├── index.html              홈 (썸네일 그리드)
├── viewer.html             뷰어 (deck iframe 임베드)
├── styles/
│   ├── main.css            홈 스타일
│   └── viewer.css          뷰어 오버레이 스타일
├── js/
│   ├── slides.js           29개 슬라이드 메타데이터
│   ├── main.js             홈 렌더러
│   └── viewer.js           뷰어 컨트롤러 (iframe 브릿지)
├── deck/                   원본 덱 (수정 금지)
├── thumbnails/             슬라이드 썸네일 PNG (slide-01.png ~ slide-29.png)
└── public/
    ├── spring-camp-2026-deck.pdf
    └── favicon.svg
```

## 로컬 실행

정적 사이트이므로 빌드 불필요.

```bash
python3 -m http.server 8080
# http://localhost:8080
```

## 키보드

- **홈**: `1` – `9` 숫자 키로 해당 슬라이드 뷰어로 점프
- **뷰어**: `←` / `→` 이전/다음, `F` 전체화면, `Esc` 홈으로, `R` 첫 슬라이드로 리셋

## 기술

- 순수 HTML/CSS/JS, 의존성 없음
- deck iframe은 `deck/index.html`의 `<deck-stage>` 웹 컴포넌트를 그대로 사용
- `postMessage({slideIndexChanged: N})` 및 `slidechange` CustomEvent로 슬라이드 상태 동기화
- URL 파라미터 `?slide=N` 딥링크 지원

## 라이선스

슬라이드 콘텐츠 및 본 뷰어 코드의 저작권은 박준(JoonLab)에게 있습니다. All rights reserved.

