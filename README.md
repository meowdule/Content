# Content — AX 리소스 허브

기획·AX 참고용 **해외 링크 카탈로그**와 **팀 컨텐츠 영역**을 한 페이지에서 보여 주는 정적 사이트입니다. [저장소](https://github.com/meowdule/Content).

## 라이브 사이트

GitHub Pages 를 켠 뒤 주소는 대략 다음과 같습니다 (저장소명이 `Content` 인 **Project site** 인 경우 경로를 포함합니다).

- `https://meowdule.github.io/Content/`

> 로컬에서 `index.html` 을 직접 열어도 동작하지만, `fetch` 로 JSON 을 불러오므로 브라우저에 따라 차이가 나면 간단히 정적 서버를 쓰면 됩니다. 예: `py -m http.server 8765`

## Pages 설정 방법

1. GitHub 에서 저장소 **Settings → Pages**.
2. **Build and deployment**: **Deploy from a branch**.
3. Branch: **`main`** / 폴더: **`/` (root)** → Save.
4. 반영까지 1–2분 정도 걸릴 수 있습니다.

(대안으로 **GitHub Actions** 로 배포하고 싶다면 저장소 설정에서 소스를 **GitHub Actions** 로 바꾼 뒤 워크플로를 추가하면 됩니다. 지금 레포에는 브랜치 배포만 안내합니다.)

## 데이터 구조 — 정보가 어디에 “남나”?

| 파일 | 역할 |
|------|------|
| [`data/config.json`](data/config.json) | `githubRepo`(소유자/저장소) — 헤더·기여 버튼 URL 생성 |
| [`data/overseas.json`](data/overseas.json) | 해외 게시글·리포트 등 **링크 수집** |
| [`data/community.json`](data/community.json) | **우리 팀 컨텐츠** 항목 (기여 안내 블록은 앱이 맨 앞에 붙임) |

형식은 둘 다 동일합니다: 카테고리 배열 → 각각 `items` 안에 `{ "title", "desc", "url" }`.

**GitHub Pages 는 정적 호스팅**이라 방문자가 웹 페이지에서 “저장 버튼”만 눌러 서버에 쓸 수 있는 구조는 아닙니다. **동일 사용자가 페이지를 다시 방문했을 때도 같은 정보를 보려면**, 그 내용이 **이 저장소의 파일로 커밋**되어야 합니다.

기여 패턴 요약:

- **커밋 권한 O**: 브라우저에서 해당 JSON 파일 **편집 → 커밋** 또는 로컬에서 수정 후 push.
- **권한 X**: 저장소를 **포크하고 PR 제출**, 또는 **[이슈 템플릿으로 요청](./.github/ISSUE_TEMPLATE/content-submission.md)** 후 관리자가 JSON 에 반영.

## 다른 깃허브 저장소로 옮길 때

1. [`data/config.json`](data/config.json) 의 `githubRepo` 를 `소유자/저장소이름` 으로 수정합니다.
2. ([`index.html`](index.html) 의 `<meta name="github-repo" ...>` 가 있으면 동일하게 맞춥니다. 메타가 있으면 메타가 **우선**입니다.)
3. 맨 위·푸터의 링크는 로드 시 `config.json` 기준으로 맞춰지지만, 포크 직후 혼동을 줄이려면 HTML 의 초기 `href` 도 같이 바꿔 두면 좋습니다.

## 첫 푸시 (저장소가 비어 있는 경우)

```bash
git init
git add .
git commit -m "feat: AX hub with overseas/community JSON for GitHub Pages"
git branch -M main
git remote add origin https://github.com/meowdule/Content.git
git push -u origin main
```

## 라이선스

콘텐츠·링크 목록은 해당 출처 라이선스를 따릅니다. 레포 코드는 필요에 따라 사용하세요.
