(function () {
  "use strict";

  const DEFAULT_REPO = "meowdule/Content";
  const TAB_KEY = "ax-hub-space";

  /** @typedef {{ id: string, emoji: string, title: string, subtitle: string, items: CatalogItem[] }} Section */
  /** @typedef {{ title: string, desc?: string, url: string, submissionId?: string }} CatalogItem */

  /** @typedef {{ id: string, space: string, categoryId: string, title: string, desc?: string, url: string, createdAt?: string, updatedAt?: string }} SubmissionEntry */

  /** @type {{ overseas: Section[], community: Section[] } | null} */
  let datasets = null;

  /** @type {'overseas' | 'community'} */
  let activeSpace = "overseas";

  let navObserver = null;

  let searchBound = false;

  /** @type {Section[]} */
  let baselineOverseasArr = [];

  /** @type {Section[]} */
  let communityRowsRaw = [];

  /** 최근 불러온 등록 목록 · 수정 폼 채우기용 */
  /** @type {SubmissionEntry[]} */
  let lastSubmissionEntries = [];

  /** @type {{ githubRepo: string, apiBase: string }} */
  let hubConfig = { githubRepo: DEFAULT_REPO, apiBase: "" };

  const catalogEl = document.getElementById("catalog");
  const searchEl = document.getElementById("search");
  const navDesktop = document.getElementById("nav-desktop");
  const navMobile = document.getElementById("nav-mobile");
  const searchCountEl = document.getElementById("search-count");
  const expandBtn = document.getElementById("expand-all");
  const collapseBtn = document.getElementById("collapse-all");
  const themeBtn = document.getElementById("theme-toggle");
  const contribStrip = document.getElementById("contrib-strip");
  const tabOverseas = document.getElementById("tab-overseas");
  const tabCommunity = document.getElementById("tab-community");
  const fabRegister = document.getElementById("fab-register");

  const dlgRegister = document.getElementById("dlg-register");
  const dlgRegisterForm = /** @type {HTMLFormElement | null} */ (
    document.getElementById("form-register")
  );
  const regSpaceOverseas = /** @type {HTMLInputElement | null} */ (
    document.getElementById("reg-space-overseas")
  );
  const regSpaceCommunity = /** @type {HTMLInputElement | null} */ (
    document.getElementById("reg-space-community")
  );
  const regCategory = /** @type {HTMLSelectElement | null} */ (
    document.getElementById("reg-category")
  );
  const regTitle = /** @type {HTMLInputElement | null} */ (
    document.getElementById("reg-title")
  );
  const regDesc = /** @type {HTMLInputElement | null} */ (
    document.getElementById("reg-desc")
  );
  const regUrl = /** @type {HTMLInputElement | null} */ (
    document.getElementById("reg-url")
  );
  const regApiHint = document.getElementById("reg-api-hint");

  const dlgEdit = document.getElementById("dlg-edit");
  const dlgEditForm = /** @type {HTMLFormElement | null} */ (
    document.getElementById("form-edit")
  );
  const editId = /** @type {HTMLInputElement | null} */ (
    document.getElementById("edit-id")
  );
  const editPwd = /** @type {HTMLInputElement | null} */ (
    document.getElementById("edit-password")
  );
  const editCategory = /** @type {HTMLSelectElement | null} */ (
    document.getElementById("edit-category")
  );
  const editTitle = /** @type {HTMLInputElement | null} */ (
    document.getElementById("edit-title")
  );
  const editDesc = /** @type {HTMLInputElement | null} */ (
    document.getElementById("edit-desc")
  );
  const editUrl = /** @type {HTMLInputElement | null} */ (
    document.getElementById("edit-url")
  );

  const dlgDelete = document.getElementById("dlg-delete");
  const delId = /** @type {HTMLInputElement | null} */ (
    document.getElementById("delete-id")
  );
  const delPwd = /** @type {HTMLInputElement | null} */ (
    document.getElementById("delete-password")
  );
  const formDelete =
    /** @type {HTMLFormElement | null} */ (document.getElementById("form-delete"));

  const THEME_KEY = "ax-hub-theme";

  /** @type {string} */
  let repoSlug = DEFAULT_REPO;

  /** @returns {SubmissionEntry[]} */
  async function fetchSubmissionsEntries() {
    try {
      const bust = `_=${Date.now()}`;
      const r = await fetch(`data/public-submissions.json?${bust}`, {
        cache: "no-store",
      });
      if (!r.ok) return [];
      /** @type {{ entries?: unknown }} */
      const j = await r.json();
      if (!Array.isArray(j.entries)) return [];
      return /** @type {SubmissionEntry[]} */ (j.entries);
    } catch {
      return [];
    }
  }

  function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  function escapeAttr(text) {
    return String(text)
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/</g, "&lt;");
  }

  function slugifyHeading(text, id) {
    return id || text.toLowerCase().replace(/\s+/g, "-").replace(/[^\w-]/g, "");
  }

  /** @param {'overseas' | 'community'} space */
  /** @param {Section} section */
  function sectionDomId(space, section) {
    const p = space === "overseas" ? "o" : "c";
    return `${p}-${slugifyHeading(section.title, section.id)}`;
  }

  function getSections() {
    if (!datasets) return [];
    return activeSpace === "overseas"
      ? datasets.overseas
      : datasets.community;
  }

  /** @returns {{ owner: string, name: string } | null} */
  function parseRepo(slug) {
    const p = slug.split("/").map((s) => s.trim()).filter(Boolean);
    if (p.length >= 2) return { owner: p[0], name: p[1] };
    return null;
  }

  /**
   * @param {string} slug
   */
  function buildContribSection(slug) {
    const parsed = parseRepo(slug) || parseRepo(DEFAULT_REPO);
    if (!parsed) {
      const parts = DEFAULT_REPO.split("/");
      const readmeMain =
        parts.length >= 2
          ? `https://github.com/${parts[0]}/${parts[1]}/blob/main/README.md`
          : "https://github.com/";
      return {
        id: "contrib",
        emoji: "📂",
        title: "저장소 안내",
        subtitle:
          "data/config.json 의 githubRepo 를 올바른 owner/name 으로 설정하세요",
        items: [
          {
            title: "README — 설정 방법",
            desc: "Pages·등록 API·초안·해외 JSON 구조",
            url: readmeMain,
          },
        ],
      };
    }
    const { owner, name } = parsed;
    const base = `https://github.com/${owner}/${name}`;
    return {
      id: "contrib",
      emoji: "📂",
      title: "GitHub · 원본 JSON",
      subtitle: `${owner}/${name} — 베이스 목록은 여기서 직접 고칠 수 있습니다`,
      items: [
        {
          title: "저장소 (설정·히스토리)",
          desc: "코드·Pages·커밋 기록.",
          url: base,
        },
        {
          title: "게시글 초안 베이스 — community.json",
          desc: "초안 탭에 깔리는 고정 카테고리·예시 링크.",
          url: `${base}/edit/main/data/community.json`,
        },
        {
          title: "해외 참고 링크 베이스 — overseas.json",
          desc: "해외 탭에 깔리는 고정 레퍼런스.",
          url: `${base}/edit/main/data/overseas.json`,
        },
        {
          title: "웹 등록 결과물 — public-submissions.json",
          desc: "「+ 등록」으로 API 가 쌓은 항목(있을 때).",
          url: `${base}/blob/main/data/public-submissions.json`,
        },
        {
          title: "요청 이슈 (템플릿)",
          desc: "저장소 권한 없을 때 제목·URL 남기기.",
          url: `${base}/issues/new?template=content-submission.md`,
        },
      ],
    };
  }

  function openModal(dialog) {
    if (!dialog) return;
    dialog.removeAttribute("hidden");
    dialog.hidden = false;
    dialog.setAttribute("aria-hidden", "false");
    dialog.classList.add("modal--open");
    dialog._prevFocus = /** @type {HTMLElement | null} */ (document.activeElement);
    const fo =
      dialog.querySelector("[data-modal-initial-focus]") ||
      dialog.querySelector("input, select, textarea, button");
    if (fo && typeof fo.focus === "function")
      /** @type {HTMLElement} */ (fo).focus({ preventScroll: true });
  }

  function closeModal(dialog) {
    if (!dialog) return;
    dialog.setAttribute("hidden", "");
    dialog.hidden = true;
    dialog.setAttribute("aria-hidden", "true");
    dialog.classList.remove("modal--open");
    const prev = dialog._prevFocus;
    if (prev && typeof prev.focus === "function") prev.focus();
  }

  function wireModals() {
    /** @param {HTMLElement | null} shell */
    function one(shell) {
      if (!shell || shell.dataset.modalWired === "1") return;
      shell.dataset.modalWired = "1";
      shell.addEventListener("click", (ev) => {
        const t = /** @type {HTMLElement} */ (ev.target);
        if (t.closest("[data-modal-close]")) closeModal(shell);
        else if (t.matches("[data-modal-backdrop]")) closeModal(shell);
      });
    }

    one(dlgRegister);
    one(dlgEdit);
    one(dlgDelete);
  }

  function apiOrigin() {
    return (hubConfig.apiBase || "").replace(/\/$/, "");
  }

  /** @type {SubmissionEntry[]} */
  function normalizeEntries(entries) {
    const clean = [];
    for (const e of entries || []) {
      if (
        !e ||
        typeof e !== "object" ||
        typeof e.id !== "string" ||
        !e.space
      )
        continue;
      /** @type {SubmissionEntry} */
      const ce = /** @type {SubmissionEntry} */ (e);

      const title = typeof ce.title === "string" ? ce.title.trim() : "";
      const url = typeof ce.url === "string" ? ce.url.trim() : "";
      if (!title || !url) continue;
      clean.push(ce);
    }
    return clean;
  }

  /**
   * @param {Section[]} baseSections
   * @param {SubmissionEntry[]} entries
   * @param {'overseas'|'community'} spaceKey
   */
  function mergeSections(baseSections, entries, spaceKey) {
    const sections =
      /** @type {Section[]} */ (JSON.parse(JSON.stringify(baseSections)));
    const list = entries.filter((e) => e && e.space === spaceKey);

    /** @type {CatalogItem[]} */
    const orphanItems = [];

    for (const e of list) {
      const title = typeof e.title === "string" ? e.title.trim() : "";
      const url = typeof e.url === "string" ? e.url.trim() : "";
      const cat = typeof e.categoryId === "string" ? e.categoryId.trim() : "";
      if (!title || !url) continue;

      const sec = cat ? sections.find((s) => s.id === cat) : null;
      /** @type {CatalogItem} */
      const item = {
        title: e.title || "",
        desc: typeof e.desc === "string" ? e.desc : "",
        url: e.url || "",
        submissionId: e.id,
      };
      if (sec) sec.items.push(item);
      else orphanItems.push(item);
    }

    if (orphanItems.length > 0) {
      sections.push({
        id: "user-orphan",
        emoji: "📥",
        title: "사용자 등록 · 미매칭",
        subtitle:
          "categoryId가 존재하지 않거나 카테고리 이름이 변경된 글입니다",
        items: orphanItems,
      });
    }

    return sections;
  }

  async function applyMergedFromEntries(entries) {
    lastSubmissionEntries = normalizeEntries(entries);
    const communityBase = [buildContribSection(repoSlug), ...communityRowsRaw];
    datasets = {
      overseas: mergeSections(baselineOverseasArr, lastSubmissionEntries, "overseas"),
      community: mergeSections(
        communityBase,
        lastSubmissionEntries,
        "community"
      ),
    };
  }

  async function reloadAfterMutation(message) {
    const entries = await fetchSubmissionsEntries();
    await applyMergedFromEntries(entries);
    buildNav();
    buildSections();
    observeNavFresh();
    filterResources();
    if (message) {
      /** optional toast */
      if (typeof message === "string" && window.requestAnimationFrame) {
        const n = document.getElementById("toast-mini");
        if (n) {
          n.textContent = message;
          n.removeAttribute("hidden");
          requestAnimationFrame(() => {
            setTimeout(() => {
              n.setAttribute("hidden", "");
            }, 2400);
          });
        }
      }
    }
  }

  async function loadDatasets() {
    const meta = document
      .querySelector('meta[name="github-repo"]')
      ?.getAttribute("content")
      ?.trim();
    const [overseasRes, communityRes, configRes] = await Promise.all([
      fetch("data/overseas.json", { cache: "no-cache" }),
      fetch("data/community.json", { cache: "no-cache" }),
      fetch("data/config.json", { cache: "no-cache" }),
    ]);
    if (!overseasRes.ok)
      throw new Error(`overseas.json (${overseasRes.status})`);
    if (!communityRes.ok)
      throw new Error(`community.json (${communityRes.status})`);

    baselineOverseasArr = /** @type {Section[]} */ (await overseasRes.json());
    communityRowsRaw = /** @type {Section[]} */ (await communityRes.json());

    hubConfig.githubRepo = DEFAULT_REPO;
    hubConfig.apiBase = "";

    let slug = meta || "";

    if (configRes.ok) {
      try {
        /** @type {{ githubRepo?: string; apiBase?: string }} */
        const c = await configRes.json();
        if (c.githubRepo) slug = slug || String(c.githubRepo).trim();
        hubConfig.githubRepo =
          slug || String(c.githubRepo || "").trim() || DEFAULT_REPO;
        hubConfig.apiBase = (c.apiBase || "").trim();
      } catch {
        hubConfig.githubRepo = slug || DEFAULT_REPO;
      }
    } else {
      hubConfig.githubRepo = slug || DEFAULT_REPO;
    }

    repoSlug = slug || hubConfig.githubRepo || DEFAULT_REPO;

    const submissions = await fetchSubmissionsEntries();
    await applyMergedFromEntries(submissions);
  }

  function renderContribStrip() {
    const parsed = parseRepo(repoSlug) || parseRepo(DEFAULT_REPO);
    const headerRepo =
      /** @type {HTMLAnchorElement | null} */ (
        document.getElementById("link-repo-root")
      );
    const footerRepoMid =
      /** @type {HTMLAnchorElement | null} */ (
        document.getElementById("link-repo-mid-footer")
      );
    const footerReadme =
      /** @type {HTMLAnchorElement | null} */ (
        document.getElementById("link-repo-readme-footer")
      );

    if (!parsed) {
      if (contribStrip) contribStrip.innerHTML = "";
      return;
    }
    const { owner, name } = parsed;
    const base = `https://github.com/${owner}/${name}`;
    const readmeUrl = `${base}/blob/main/README.md`;
    if (headerRepo) headerRepo.href = base;
    if (footerRepoMid) footerRepoMid.href = base;
    if (footerReadme) footerReadme.href = readmeUrl;

    if (!contribStrip) return;

    contribStrip.innerHTML =
      `<div class="contrib-inner">
        <span class="contrib-label">GitHub</span>
        <a class="contrib-chip" href="${escapeHtml(
          base
        )}" target="_blank" rel="noopener noreferrer">저장소</a>
        <a class="contrib-chip" href="${escapeHtml(
          `${base}/edit/main/data/community.json`
        )}" target="_blank" rel="noopener noreferrer">초안 베이스</a>
        <a class="contrib-chip" href="${escapeHtml(
          `${base}/edit/main/data/overseas.json`
        )}" target="_blank" rel="noopener noreferrer">해외 베이스</a>
        <a class="contrib-chip" href="${escapeHtml(
          `${base}/blob/main/data/public-submissions.json`
        )}" target="_blank" rel="noopener noreferrer">웹 등록분</a>
        <a class="contrib-chip" href="${escapeHtml(
          `${base}/issues/new?template=content-submission.md`
        )}" target="_blank" rel="noopener noreferrer">이슈로 요청</a>
      </div>`;
  }

  /* --- 테마 등 (기존) --- */

  function initTheme() {
    const stored =
      localStorage.getItem(THEME_KEY) ||
      (window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light");
    document.documentElement.setAttribute(
      "data-theme",
      stored === "dark" ? "dark" : "light"
    );
    updateThemeToggleLabel(stored === "dark");
  }

  function updateThemeToggleLabel(isDark) {
    if (!themeBtn) return;
    themeBtn.setAttribute(
      "aria-label",
      isDark ? "라이트 모드로 전환" : "다크 모드로 전환"
    );
    themeBtn.textContent = isDark ? "라이트" : "다크";
  }

  themeBtn?.addEventListener("click", () => {
    const cur =
      document.documentElement.getAttribute("data-theme") === "dark"
        ? "dark"
        : "light";
    const next = cur === "dark" ? "light" : "dark";
    document.documentElement.setAttribute(
      "data-theme",
      next === "dark" ? "dark" : "light"
    );
    localStorage.setItem(THEME_KEY, next);
    updateThemeToggleLabel(next === "dark");
  });

  function applyTabFromHashOrStorage() {
    const raw = window.location.hash.slice(1);
    if (raw === "tab-community" || raw.startsWith("c-")) {
      activeSpace = "community";
      return;
    }
    if (raw === "tab-overseas" || raw.startsWith("o-")) {
      activeSpace = "overseas";
      return;
    }
    const stored = localStorage.getItem(TAB_KEY);
    if (stored === "community" || stored === "overseas") activeSpace = stored;
    else activeSpace = "overseas";
  }

  function updateTabUI() {
    tabOverseas?.setAttribute(
      "aria-selected",
      activeSpace === "overseas" ? "true" : "false"
    );
    tabCommunity?.setAttribute(
      "aria-selected",
      activeSpace === "community" ? "true" : "false"
    );
  }

  function updateSidebarNote() {
    const note = document.getElementById("data-src-note");
    if (note) {
      note.innerHTML =
        activeSpace === "overseas"
          ? `베이스: <code>data/overseas.json</code>. 웹 등록분은 <code>public-submissions.json</code> 에서 이 탭으로 합쳐집니다.`
          : `베이스: <code>data/community.json</code> + 아래 「GitHub · 원본 JSON」. 웹 등록분은 <code>public-submissions.json</code> 에서 이 탭으로 합쳐집니다.`;
    }
  }

  /** @param {'overseas' | 'community'} space @param {boolean} [writeHash] */
  function switchSpace(space, writeHash) {
    activeSpace = space;
    localStorage.setItem(TAB_KEY, space);
    updateTabUI();
    buildNav();
    buildSections();
    filterResources();
    updateSidebarNote();
    if (writeHash)
      history.replaceState(
        null,
        "",
        space === "community" ? "#tab-community" : "#tab-overseas"
      );
  }

  function initTabs() {
    tabOverseas?.addEventListener("click", () =>
      switchSpace("overseas", true)
    );
    tabCommunity?.addEventListener("click", () =>
      switchSpace("community", true)
    );
  }

  function buildNav() {
    const SECTIONS = getSections();
    if (!navDesktop) return;
    navDesktop.innerHTML = SECTIONS.map(
      (s) =>
        `<li><a class="nav-link" href="#${escapeAttr(sectionDomId(activeSpace, s))}">
          <span class="nav-emoji">${escapeHtml(s.emoji)}</span>
          <span>${escapeHtml(s.title)}</span>
          <span class="nav-count">${s.items.length}</span>
        </a></li>`
    ).join("");

    if (navMobile) {
      navMobile.innerHTML =
        `<option value="">카테고리로 이동…</option>` +
        SECTIONS.map(
          (s) =>
            `<option value="#${escapeAttr(
              sectionDomId(activeSpace, s)
            )}">${escapeHtml(s.emoji + " " + s.title)}</option>`
        ).join("");
    }
  }

  function initSearchOnce() {
    if (searchBound) return;
    searchBound = true;
    searchEl?.addEventListener("input", filterResources);
  }

  /**
   * @param {CatalogItem} it
   * @param {Section} section
   */
  function renderItemLi(it, section) {
    const lower = `${it.title} ${it.desc || ""}`.toLowerCase();

    const hasSub =
      !!(it.submissionId && typeof it.submissionId === "string");

    const linkInner = `
      <div class="resource-main">
        <div class="resource-title-row">
          <p class="resource-title">${escapeHtml(it.title)}</p>
          ${hasSub ? `<span class="pill-sub">등록글</span>` : ""}
        </div>
        <p class="resource-desc">${escapeHtml(it.desc || "")}</p>
      </div>
      <span class="external-cta" aria-hidden="true">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M7 17L17 7"/><path d="M7 7h10v10"/></svg>
      </span>`;

    if (!hasSub) {
      return `<li class="resource-item" data-text="${escapeAttr(lower)}">
        <a class="resource-link-card" href="${escapeHtml(
          it.url
        )}" target="_blank" rel="noopener noreferrer">
          ${linkInner}
        </a>
      </li>`;
    }

    const sid = escapeAttr(it.submissionId || "");
    const actions = `
      <div class="resource-actions" aria-label="등록글 관리">
        <button type="button" class="btn-mini" data-sub-action="edit" data-submission-id="${sid}">수정</button>
        <button type="button" class="btn-mini btn-mini--danger" data-sub-action="delete" data-submission-id="${sid}">삭제</button>
      </div>`;

    return `<li class="resource-item resource-item--with-actions" data-text="${escapeAttr(
      lower
    )}">
      <div class="resource-split">
        <a class="resource-link-card resource-link-grow" href="${escapeHtml(
          it.url
        )}" target="_blank" rel="noopener noreferrer">
          ${linkInner}
        </a>
        ${actions}
      </div>
    </li>`;
  }

  function buildSections() {
    const SECTIONS = getSections();
    if (!catalogEl) return;

    catalogEl.innerHTML = SECTIONS.map((section, idx) => {
      const secId = sectionDomId(activeSpace, section);
      const expanded = idx === 0 ? "true" : "false";
      const itemsHtml = section.items
        .map((it) => renderItemLi(it, section))
        .join("");

      return `<section class="section" id="${escapeAttr(secId)}" data-section>
        <h2 class="visually-hidden">${escapeHtml(section.title)}</h2>
        <button type="button" class="section-trigger"
          aria-expanded="${expanded}"
          aria-controls="panel-${escapeAttr(secId)}"
          id="heading-${escapeAttr(secId)}">
          <span class="section-icon" aria-hidden="true">${escapeHtml(
            section.emoji
          )}</span>
          <div class="section-heading">
            <div class="section-title-row">
              <p class="section-title">${escapeHtml(section.title)}</p>
              <span class="section-count">${section.items.length}개 링크</span>
            </div>
            <p class="section-subtitle">${escapeHtml(section.subtitle)}</p>
          </div>
          <span class="chevron" aria-hidden="true">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/></svg>
          </span>
        </button>
        <div class="section-panel ${expanded !== "true" ? "section-panel--collapsed" : ""}" id="panel-${escapeAttr(secId)}" role="region" aria-labelledby="heading-${escapeAttr(secId)}">
          <ul class="resource-list">${itemsHtml}</ul>
        </div>
      </section>`;
    }).join("");

    const triggers = catalogEl.querySelectorAll(".section-trigger");
    triggers.forEach((btn) => {
      btn.addEventListener("click", () =>
        toggleSection(/** @type {HTMLElement} */ (btn))
      );
    });

    filterResources();
    observeNavFresh();
  }

  /** @param {HTMLElement} btn */
  function toggleSection(btn) {
    const expanded = btn.getAttribute("aria-expanded") === "true";
    const next = !expanded;
    btn.setAttribute("aria-expanded", String(next));
    const panelId = btn.getAttribute("aria-controls");
    const panel = panelId ? document.getElementById(panelId) : null;
    if (panel) panel.classList.toggle("section-panel--collapsed", !next);
  }

  /** @param {HTMLElement} btn @param {boolean} open */
  function setSectionOpen(btn, open) {
    btn.setAttribute("aria-expanded", String(open));
    const panelId = btn.getAttribute("aria-controls");
    const panel = panelId ? document.getElementById(panelId) : null;
    if (panel) panel.classList.toggle("section-panel--collapsed", !open);
  }

  expandBtn?.addEventListener("click", () => {
    document.querySelectorAll(".section-trigger").forEach((btn) =>
      setSectionOpen(/** @type {HTMLElement} */ (btn), true)
    );
  });

  collapseBtn?.addEventListener("click", () => {
    document.querySelectorAll(".section-trigger").forEach((btn) =>
      setSectionOpen(/** @type {HTMLElement} */ (btn), false)
    );
  });

  function filterResources() {
    const q = (searchEl?.value || "").trim().toLowerCase();
    let visibleSections = 0;
    const sections = [...document.querySelectorAll("[data-section]")];

    sections.forEach((sec) => {
      let visibleItems = 0;
      const items = sec.querySelectorAll(".resource-item");

      items.forEach((item) => {
        const hay = item.getAttribute("data-text") || "";
        const ok = !q || hay.includes(q);
        item.classList.toggle("hidden", !ok);
        if (ok) visibleItems++;
      });

      const hideSec = visibleItems === 0 && q !== "";
      sec.classList.toggle("hidden", hideSec);
      if (!hideSec || q === "") visibleSections++;

      if (q !== "" && visibleItems > 0) {
        const tr = sec.querySelector(".section-trigger");
        if (tr) setSectionOpen(/** @type {HTMLElement} */ (tr), true);
      }
    });

    if (searchCountEl)
      searchCountEl.textContent = q
        ? `표시 중: ${visibleSections}개 카테고리 · "${searchEl?.value.trim()}"`
        : "";

    if (visibleSections === 0 && q !== "" && catalogEl) {
      let empty = catalogEl.querySelector(".empty-state");
      if (!empty) {
        empty = document.createElement("p");
        empty.className = "empty-state";
        empty.textContent = "검색 결과가 없습니다. 다른 키워드를 시도해 보세요.";
        catalogEl.appendChild(empty);
      }
    } else {
      catalogEl?.querySelector(".empty-state")?.remove();
    }
  }

  function observeNavFresh() {
    if (navObserver) navObserver.disconnect();
    navObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const id = entry.target.id;
          document.querySelectorAll(".nav-link").forEach((a) => {
            const el = /** @type {HTMLElement} */ (a);
            el.dataset.active =
              (a.getAttribute("href") === `#${id}`) ? "true" : "false";
          });
        });
      },
      { rootMargin: "-40% 0px -55% 0px", threshold: [0, 1] }
    );

    document.querySelectorAll("[data-section]").forEach((sec) =>
      navObserver.observe(sec)
    );
  }

  navMobile?.addEventListener("change", () => {
    const v = navMobile.value.trim();
    if (v) window.location.hash = v.startsWith("#") ? v : `#${v}`;
    navMobile.selectedIndex = 0;
  });

  /** @param {string} secId */
  function revealSectionById(secId) {
    const sec = document.getElementById(secId);
    if (!sec) return false;
    const tr = sec.querySelector(".section-trigger");
    if (tr) setSectionOpen(/** @type {HTMLElement} */ (tr), true);
    return true;
  }

  /** @param {string} secId */
  function scrollToSection(secId, smoothScroll) {
    const sec = document.getElementById(secId);
    if (!sec) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)")
      .matches;
    sec.scrollIntoView({
      behavior: reduce || !smoothScroll ? "auto" : "smooth",
      block: "start",
    });
  }

  function applyHashFromLocation(smoothScroll) {
    const raw = window.location.hash.slice(1);
    let needRebuild = false;
    if (raw.startsWith("c-") && activeSpace !== "community") {
      activeSpace = "community";
      needRebuild = true;
    } else if (raw.startsWith("o-") && activeSpace !== "overseas") {
      activeSpace = "overseas";
      needRebuild = true;
    }

    if (needRebuild) {
      localStorage.setItem(TAB_KEY, activeSpace);
      updateTabUI();
      buildNav();
      buildSections();
      renderContribStrip();
      updateSidebarNote();
    }

    document.querySelectorAll(".nav-link").forEach((a) => {
      const el = /** @type {HTMLElement} */ (a);
      el.dataset.active =
        raw && (a.getAttribute("href") === `#${raw}`) ? "true" : "false";
    });

    if (raw.startsWith("c-") || raw.startsWith("o-")) {
      requestAnimationFrame(() => {
        if (revealSectionById(raw)) scrollToSection(raw, !!smoothScroll);
      });
    }
  }

  window.addEventListener("hashchange", () => applyHashFromLocation(true));

  /* --- 카테고리 옵션 (등록/수정) --- */

  /**
   * @param {'overseas'|'community'} space
   * @returns {{ id: string; label: string }[]}
   */
  function getCategoryChoices(space) {
    if (space === "overseas") {
      return baselineOverseasArr.map((s) => ({
        id: s.id,
        label: `${s.emoji} ${s.title}`,
      }));
    }

    const base = [buildContribSection(repoSlug), ...communityRowsRaw];

    return base
      .filter((s) => s.id !== "contrib")
      .map((s) => ({ id: s.id, label: `${s.emoji} ${s.title}` }));
  }

  /**
   * @param {'overseas'|'community'} space
   * @param {HTMLSelectElement | null} sel
   * @param {string | undefined} selectedId
   */
  function fillCategorySelect(space, sel, selectedId) {
    if (!sel) return;

    /** @type {{ id: string; label: string }[]} */
    const opts = getCategoryChoices(space);
    sel.innerHTML = opts
      .map((o) => {
        const selAttr = o.id === selectedId ? " selected" : "";
        return `<option value="${escapeAttr(o.id)}"${selAttr}>${escapeHtml(o.label)}</option>`;
      })
      .join("");
    if (!opts.length) return;
    if (selectedId && opts.some((o) => o.id === selectedId))
      sel.value = selectedId;

    else sel.value = opts[0].id;
  }

  /** @param {'overseas'|'community'} space */
  function syncRegisterSpaceRadios(space) {
    if (space === "community") {
      if (regSpaceCommunity) regSpaceCommunity.checked = true;
      if (regSpaceOverseas) regSpaceOverseas.checked = false;
    } else {
      if (regSpaceOverseas) regSpaceOverseas.checked = true;
      if (regSpaceCommunity) regSpaceCommunity.checked = false;
    }
    fillCategorySelect(space, regCategory);
  }

  function updateRegisterHint() {
    if (!regApiHint) return;
    const base = apiOrigin();
    if (!base) {
      regApiHint.innerHTML =
        `<strong>등록 API 가 없습니다.</strong> <code>data/config.json</code> 의 <code>apiBase</code>에 배포한 API 주소(HTTPS 권장)를 넣고, 저장소의 <code>server/</code> 를 README 대로 실행하세요. 이 사이트(<code>github.io</code>)에서 저장하려면 CORS 에 이 출처를 허용해야 합니다.`;
      regApiHint.hidden = false;
    } else {
      regApiHint.innerHTML = `등록 API: <code>${escapeHtml(base)}</code>`;
      regApiHint.hidden = false;
    }
  }

  function openRegisterDialog() {
    updateRegisterHint();
    syncRegisterSpaceRadios(activeSpace);
    if (regTitle) regTitle.value = "";
    if (regDesc) regDesc.value = "";
    if (regUrl) regUrl.value = "";
    openModal(dlgRegister);
  }

  /**
   * @param {string} id
   */
  function openEditDialog(id) {
    const entry = lastSubmissionEntries.find((e) => e.id === id);
    if (!entry) {
      window.alert("항목을 찾을 수 없습니다. 새로고침 후 다시 시도하세요.");
      return;
    }
    if (!apiOrigin()) {
      window.alert("apiBase 가 설정되어 있어야 수정할 수 있습니다.");
      return;
    }
    const space =
      entry.space === "community" ? "community" : "overseas";
    if (editId) editId.value = entry.id;

    fillCategorySelect(space, editCategory, entry.categoryId);
    if (editTitle) editTitle.value = entry.title || "";

    if (editDesc)
      editDesc.value = typeof entry.desc === "string" ? entry.desc : "";

    if (editUrl) editUrl.value = entry.url || "";
    if (editPwd) editPwd.value = "";

    dlgEdit?.setAttribute("data-edit-space", space);
    openModal(dlgEdit);
  }

  /**
   * @param {string} id
   */
  function openDeleteDialog(id) {
    if (!apiOrigin()) {
      window.alert("apiBase 가 설정되어 있어야 삭제할 수 있습니다.");
      return;
    }
    if (delId) delId.value = id;
    if (delPwd) delPwd.value = "";
    openModal(dlgDelete);
  }

  function initRegisterEditDeleteUi() {
    wireModals();

    fabRegister?.addEventListener("click", () => openRegisterDialog());

    regSpaceOverseas?.addEventListener("change", () => {
      if (regSpaceOverseas?.checked) syncRegisterSpaceRadios("overseas");
    });
    regSpaceCommunity?.addEventListener("change", () => {
      if (regSpaceCommunity?.checked) syncRegisterSpaceRadios("community");
    });

    dlgRegisterForm?.addEventListener("submit", async (ev) => {
      ev.preventDefault();
      const origin = apiOrigin();
      if (!origin) {
        window.alert("config.json 에 apiBase 를 먼저 설정하세요.");
        return;
      }
      const space =
        regSpaceCommunity?.checked ? "community" : "overseas";
      const categoryId = regCategory?.value || "";
      const title = (regTitle?.value || "").trim();
      const desc = (regDesc?.value || "").trim();
      const url = (regUrl?.value || "").trim();

      if (!categoryId || !title || !url) {
        window.alert("카테고리·제목·URL 은 필수입니다.");
        return;
      }

      try {
        const res = await fetch(`${origin}/api/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            space,
            categoryId,
            title,
            desc,
            url,
          }),
        });
        const j = await res.json().catch(() => ({}));
        if (!res.ok || !j.ok) {
          window.alert(j.error || `등록 실패 (${res.status})`);
          return;
        }
        closeModal(dlgRegister);
        await reloadAfterMutation("등록되었습니다.");
      } catch (err) {
        window.alert(
          `요청 실패: ${/** @type {Error} */ (err).message || err}. CORS·서버 실행 여부를 확인하세요.`
        );
      }
    });

    dlgEditForm?.addEventListener("submit", async (ev) => {
      ev.preventDefault();
      const origin = apiOrigin();
      const id = (editId?.value || "").trim();
      const pw = (editPwd?.value || "").trim();
      const categoryId = (editCategory?.value || "").trim();
      const title = (editTitle?.value || "").trim();
      const desc = (editDesc?.value || "").trim();
      const url = (editUrl?.value || "").trim();
      if (!id || !pw) {
        window.alert("비밀번호를 입력하세요.");
        return;
      }
      try {
        const res = await fetch(`${origin}/api/edit`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Admin-Password": pw,
          },
          body: JSON.stringify({ id, categoryId, title, desc, url }),
        });
        const j = await res.json().catch(() => ({}));
        if (!res.ok || !j.ok) {
          window.alert(j.error || `수정 실패 (${res.status})`);
          return;
        }
        closeModal(dlgEdit);
        await reloadAfterMutation("수정되었습니다.");
      } catch (err) {
        window.alert(String(/** @type {Error} */ (err).message || err));
      }
    });

    formDelete?.addEventListener("submit", async (ev) => {
      ev.preventDefault();
      const origin = apiOrigin();
      const id = (delId?.value || "").trim();
      const pw = (delPwd?.value || "").trim();
      if (!id || !pw) return;
      try {
        const res = await fetch(`${origin}/api/delete`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Admin-Password": pw,
          },
          body: JSON.stringify({ id }),
        });
        const j = await res.json().catch(() => ({}));
        if (!res.ok || !j.ok) {
          window.alert(j.error || `삭제 실패 (${res.status})`);
          return;
        }
        closeModal(dlgDelete);
        await reloadAfterMutation("삭제되었습니다.");
      } catch (err) {
        window.alert(String(/** @type {Error} */ (err).message || err));
      }
    });

    catalogEl?.addEventListener("click", (ev) => {
      const t = /** @type {HTMLElement | null} */ (ev.target);
      const btn = t?.closest("[data-sub-action]");
      if (!btn) return;
      ev.preventDefault();
      const id = btn.getAttribute("data-submission-id");
      const act = btn.getAttribute("data-sub-action");
      if (!id) return;
      if (act === "edit") openEditDialog(id);
      else if (act === "delete") openDeleteDialog(id);
    });
  }

  async function bootstrap() {
    if (catalogEl)
      catalogEl.innerHTML = '<p class="load-state">데이터 불러오는 중…</p>';

    try {
      await loadDatasets();
    } catch (e) {
      if (catalogEl)
        catalogEl.innerHTML =
          `<div class="load-error"><strong>데이터 로드 실패</strong><p>${escapeHtml(
            String(/** @type {Error} */ (e)?.message || e)
          )}</p><p>로컬에서 파일을 더블 클릭으로 연 경우 브라우저가 요청을 막을 수 있습니다. 저장소 폴더에서 <code>py -m http.server 8765</code> 등으로 접속해 보세요.</p></div>`;
      return;
    }

    applyTabFromHashOrStorage();
    initTheme();
    initTabs();
    initRegisterEditDeleteUi();
    updateTabUI();
    initSearchOnce();
    buildNav();
    buildSections();
    renderContribStrip();
    updateSidebarNote();
    applyHashFromLocation(false);
  }

  bootstrap();
})();
