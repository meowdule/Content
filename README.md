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
| [`data/config.json`](data/config.json) | `githubRepo`, **`apiBase`**(등록 API URL, 선택) |
| [`data/overseas.json`](data/overseas.json) | 해외 게시글·리포트 등 **링크 수집** |
| [`data/community.json`](data/community.json) | **우리 팀 컨텐츠** 항목 |
| [`data/public-submissions.json`](data/public-submissions.json) | **`/api/register` 로 모인 사용자 등록** 항목 (서버가 Git 에 커밋) |

### 오픈 등록과 비밀번호 (수정·삭제)

- **등록(`/api/register`)**: 인증 없이 누구나 호출할 수 있습니다. 스팸·악성 링크를 막으려면 이후 레이트리밋·리캡차·moderation 같은 보강을 고려해야 합니다.
- **수정·삭제**: API 서버의 환경 변수 **`ADMIN_PASSWORD`** 가 일치할 때만 동작합니다. 이 값과 **`GITHUB_TOKEN` 은 절대 깃허브에 커밋하지 마세요** (`.gitignore`에 `.env`, `server/.env` 가 들어 있습니다).
- 정적 페이지만 두고 **`apiBase` 를 비워 두면** 사이트는 읽기 전용처럼 동작하고, FAB 으로는 등록 폼만 열리며 저장 시 설정 안내가 뜹니다.

## 등록 API 서버 (`server/`)

프론트는 **별도 노드 프로세스**를 두고 GitHub Contents API 로 `public-submissions.json` 을 업데이트합니다.

### 1) 설정

```bash
cd server
cp .env.example .env   # 윈도우는 복사 후 수동 이름 변경
npm install             # 또는 이미 설치됨
```

`.env` 예:

- `ADMIN_PASSWORD` — 수정·삭제 시 헤더 `X-Admin-Password` 와 같은 값
- `GITHUB_TOKEN` — 대상 레포의 **contents** 읽기/쓰기 가능한 PAT (fine-grained 권장)
- `GITHUB_OWNER`, `GITHUB_REPO` — 예: `meowdule`, `Content`
- `PORT` — 기본 `3847`

### 2) 실행

```bash
cd server && npm start
```

헬스: `curl http://127.0.0.1:3847/health`

### 3) 프론트 연결

[`data/config.json`](data/config.json) 예 (로컬 API 연결 시):

```json
{
  "githubRepo": "소유자/저장소",
  "apiBase": "http://127.0.0.1:3847"
}
```

운영에서는 Cloudflare Workers, Railway, Render 등 HTTPS 로 API 를 띄운 뒤 `apiBase` 를 그 주소로 바꿉니다. **브라우저에서 관리 비밀번호를 보낼 때는 가능하면 HTTPS** 를 사용하세요.

## 다른 깃허브 저장소로 옮길 때

1. [`data/config.json`](data/config.json) 의 `githubRepo` 를 `소유자/저장소이름` 으로 수정합니다.
2. ([`index.html`](index.html) 의 `<meta name="github-repo" ...>` 가 있으면 동일하게 맞춥니다. 메타가 있으면 메타가 **우선**입니다.)
3. 맨 위·푸터의 초기 링크와 API 배포 후 `apiBase` 를 같이 확인합니다.

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
