(function () {
  "use strict";

  const DEFAULT_REPO = "meowdule/Content";
  const TAB_KEY = "ax-hub-space";

  /** @type {{ overseas: Section[], community: Section[] } | null} */
  let datasets = null;

  /** @type {'overseas' | 'community'} */
  let activeSpace = "overseas";

  let navObserver = null;

  let searchBound = false;

  /** @typedef {{ id: string, emoji: string, title: string, subtitle: string, items: { title: string, desc: string, url: string }[] }} Section */

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

  const THEME_KEY = "ax-hub-theme";

  /** @type {string} */
  let repoSlug = DEFAULT_REPO;

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

  /**
   * @param {string} text
   * @param {string} id
   */
  function slugifyHeading(text, id) {
    return id || text.toLowerCase().replace(/\s+/g, "-").replace(/[^\w-]/g, "");
  }

  /**
   * @param {'overseas' | 'community'} space
   * @param {Section} section
   */
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

  function parseRepo(slug) {
    const p = slug.split("/").map((s) => s.trim()).filter(Boolean);
    if (p.length >= 2) return { owner: p[0], name: p[1] };
    return null;
  }

  /**
   * @param {string} slug
   * @returns {Section}
   */
  function buildContribSection(slug) {
    const parsed = parseRepo(slug) || parseRepo(DEFAULT_REPO);
    if (!parsed) {
      return {
        id: "contrib",
        emoji: "✍️",
        title: "기여 & Git",
        subtitle: "data/config.json 의 githubRepo 를 올바른 owner/name 으로 설정하세요",
        items: [
          {
            title: "README — 설정 방법",
            desc: "Pages·데이터 구조·기여 흐름",
            url: "https://github.com/meowdule/Content/blob/main/README.md",
          },
        ],
      };
    }
    const { owner, name } = parsed;
    const base = `https://github.com/${owner}/${name}`;
    return {
      id: "contrib",
      emoji: "✍️",
      title: "기여 & GitHub 연동",
      subtitle: `${owner}/${name} 저장소 JSON·이슈로 목록이 유지됩니다`,
      items: [
        {
          title: "저장소 (코드·이슈·설정)",
          desc: "소스와 GitHub Pages 설정.",
          url: base,
        },
        {
          title: "우리 컨텐츠 편집 — data/community.json",
          desc: "쓰기 권한이 있으면 웹에서 바로 수정·커밋.",
          url: `${base}/edit/main/data/community.json`,
        },
        {
          title: "해외 수집 편집 — data/overseas.json",
          desc: "해외 레퍼런스 항목 추가.",
          url: `${base}/edit/main/data/overseas.json`,
        },
        {
          title: "등록 요청 이슈",
          desc: "권한 없는 동료는 템플릿으로 제안.",
          url: `${base}/issues/new?template=content-submission.md`,
        },
        {
          title: "포크 후 Pull Request",
          desc: "외부 기여자용 일반적인 흐름.",
          url: `${base}/fork`,
        },
      ],
    };
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
    const overseas = await overseasRes.json();
    const communityRaw = await communityRes.json();
    let slug = meta || "";
    if (!slug && configRes.ok) {
      try {
        const c = await configRes.json();
        if (c.githubRepo) slug = String(c.githubRepo).trim();
      } catch (_) {
        /* ignore */
      }
    }
    repoSlug = slug || DEFAULT_REPO;
    const community = [buildContribSection(repoSlug), ...communityRaw];
    datasets = { overseas, community };
  }

  function renderContribStrip() {
    const parsed = parseRepo(repoSlug) || parseRepo(DEFAULT_REPO);
    const headerRepo = /** @type {HTMLAnchorElement | null} */ (
      document.getElementById("link-repo-root")
    );
    const footerRepoMid = /** @type {HTMLAnchorElement | null} */ (
      document.getElementById("link-repo-mid-footer")
    );
    const footerReadme = /** @type {HTMLAnchorElement | null} */ (
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
        )}" target="_blank" rel="noopener noreferrer">community.json</a>
        <a class="contrib-chip" href="${escapeHtml(
          `${base}/edit/main/data/overseas.json`
        )}" target="_blank" rel="noopener noreferrer">overseas.json</a>
        <a class="contrib-chip" href="${escapeHtml(
          `${base}/issues/new?template=content-submission.md`
        )}" target="_blank" rel="noopener noreferrer">등록 요청</a>
      </div>`;
  }

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
    if (stored === "community" || stored === "overseas")
      activeSpace = stored;
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
          ? `목록 원본은 <code>data/overseas.json</code> 입니다.`
          : `기본 카드는 <code>data/community.json</code> 과 자동 생성된 기여 카테고리입니다.`;
    }
  }

  /**
   * @param {'overseas' | 'community'} space
   * @param {boolean} [writeHash]
   */
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

  function buildSections() {
    const SECTIONS = getSections();
    if (!catalogEl) return;

    catalogEl.innerHTML = SECTIONS.map((section, idx) => {
      const secId = sectionDomId(activeSpace, section);
      const expanded = idx === 0 ? "true" : "false";
      const itemsHtml = section.items
        .map(
          (it) =>
            `<li class="resource-item" data-text="${escapeAttr(
              `${it.title} ${it.desc}`.toLowerCase()
            )}">
            <a class="resource-link-card" href="${escapeHtml(
              it.url
            )}" target="_blank" rel="noopener noreferrer">
              <div class="resource-main">
                <div class="resource-title-row">
                  <p class="resource-title">${escapeHtml(it.title)}</p>
                </div>
                <p class="resource-desc">${escapeHtml(it.desc)}</p>
              </div>
              <span class="external-cta" aria-hidden="true">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17L17 7"/><path d="M7 7h10v10"/></svg>
              </span>
            </a>
          </li>`
        )
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

  async function bootstrap() {
    if (catalogEl)
      catalogEl.innerHTML =
        '<p class="load-state">데이터 불러오는 중…</p>';

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
