(function () {
  "use strict";

  const TAB_KEY = "ax-hub-space";

  /** @typedef {{ id: string, emoji: string, title: string, subtitle: string, items: CatalogItem[] }} Section */
  /** @typedef {{ title: string, desc?: string, url: string, submissionId?: string, postedAt?: string }} CatalogItem */

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

  /** @type {{ apiBase: string }} */
  let hubConfig = { apiBase: "" };

  const catalogEl = document.getElementById("catalog");
  const searchEl = document.getElementById("search");
  const navDesktop = document.getElementById("nav-desktop");
  const navMobile = document.getElementById("nav-mobile");
  const searchCountEl = document.getElementById("search-count");
  const expandBtn = document.getElementById("expand-all");
  const collapseBtn = document.getElementById("collapse-all");
  const themeBtn = document.getElementById("theme-toggle");
  const tabOverseas = document.getElementById("tab-overseas");
  const tabCommunity = document.getElementById("tab-community");
  const btnRegisterTab = document.getElementById("btn-register-tab");

  const rangeStartInp = /** @type {HTMLInputElement | null} */ (
    document.getElementById("range-start")
  );
  const rangeEndInp = /** @type {HTMLInputElement | null} */ (
    document.getElementById("range-end")
  );

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

  const PERIOD_ALLOWED = [7, 30, 90, 182, 365];

  const RANGE_START_KEY = "ax-hub-range-start";
  const RANGE_END_KEY = "ax-hub-range-end";

  const THEME_KEY = "ax-hub-theme";

  /** @param {Date} d */
  function toYMDLocal(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  /**
   * 단축 칩: 종료일 오늘(로컬). 1년은 시작을 1년 전 같은 날, 그 외는 오늘 포함 N일.
   * @param {number} days
   */
  function getPresetRangeStrings(days) {
    const end = new Date();
    const start = new Date(end);
    if (days === 365) {
      start.setFullYear(start.getFullYear() - 1);
    } else {
      start.setDate(start.getDate() - (days - 1));
    }
    return { start: toYMDLocal(start), end: toYMDLocal(end) };
  }

  function applyPeriodPresetToInputs(days) {
    const { start, end } = getPresetRangeStrings(days);
    if (rangeStartInp) rangeStartInp.value = start;
    if (rangeEndInp) rangeEndInp.value = end;
  }

  function syncPeriodChipHighlight() {
    const wrap = document.getElementById("period-filter");
    if (!wrap || !rangeStartInp || !rangeEndInp) return;
    const rs = rangeStartInp.value.trim();
    const re = rangeEndInp.value.trim();
    wrap.querySelectorAll("[data-period-days]").forEach((btn) => {
      const d = parseInt(btn.getAttribute("data-period-days") || "0", 10);
      if (!PERIOD_ALLOWED.includes(d)) return;
      const pr = getPresetRangeStrings(d);
      btn.classList.toggle("period-chip--active", rs === pr.start && re === pr.end);
    });
  }

  /** @param {string} iso */
  function parseLocalDayStartMs(iso) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
    if (!m) return NaN;
    return new Date(
      Number(m[1]),
      Number(m[2]) - 1,
      Number(m[3]),
      0,
      0,
      0,
      0
    ).getTime();
  }

  /** @param {string} iso */
  function parseLocalDayEndMs(iso) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
    if (!m) return NaN;
    return new Date(
      Number(m[1]),
      Number(m[2]) - 1,
      Number(m[3]),
      23,
      59,
      59,
      999
    ).getTime();
  }

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

  /**
   * @param {unknown} secArr
   * @returns {Section[]}
   */
  function normalizeBaselineSections(secArr) {
    if (!Array.isArray(secArr)) return [];
    return secArr.map((sec) => {
      /** @type {Section} */
      const s = /** @type {Section} */ (sec);
      const items = Array.isArray(s.items) ? s.items : [];
      return {
        ...s,
        items: items.map((it) => {
          /** @type {Record<string, unknown>} */
          const raw = /** @type {Record<string, unknown>} */ (it);
          const cand =
            (typeof raw.postedAt === "string" && raw.postedAt.trim()) ||
            (typeof raw.date === "string" && raw.date.trim()) ||
            (typeof raw.publishedAt === "string" && raw.publishedAt.trim()) ||
            "";
          let postedAt = cand ? String(cand).trim() : undefined;
          if (postedAt) {
            const ms = Date.parse(postedAt);
            postedAt = Number.isNaN(ms) ? undefined : new Date(ms).toISOString();
          }
          /** @type {CatalogItem} */
          const out = {
            title: String(raw.title || ""),
            desc: typeof raw.desc === "string" ? raw.desc : "",
            url: String(raw.url || ""),
          };
          if (postedAt) out.postedAt = postedAt;
          return out;
        }),
      };
    });
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
      const ts = e.updatedAt || e.createdAt;
      if (ts) item.postedAt = new Date(ts).toISOString();

      if (sec) sec.items.push(item);
      else orphanItems.push(item);
    }

    if (orphanItems.length > 0) {
      sections.push({
        id: "user-orphan",
        emoji: "📥",
        title: "미매칭",
        subtitle: " ",
        items: orphanItems,
      });
    }

    return sections;
  }

  async function applyMergedFromEntries(entries) {
    lastSubmissionEntries = normalizeEntries(entries);
    datasets = {
      overseas: mergeSections(baselineOverseasArr, lastSubmissionEntries, "overseas"),
      community: mergeSections(communityRowsRaw, lastSubmissionEntries, "community"),
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
    const [overseasRes, communityRes, configRes] = await Promise.all([
      fetch("data/overseas.json", { cache: "no-cache" }),
      fetch("data/community.json", { cache: "no-cache" }),
      fetch("data/config.json", { cache: "no-cache" }),
    ]);
    if (!overseasRes.ok)
      throw new Error(`overseas.json (${overseasRes.status})`);
    if (!communityRes.ok)
      throw new Error(`community.json (${communityRes.status})`);

    baselineOverseasArr = normalizeBaselineSections(await overseasRes.json());
    communityRowsRaw = normalizeBaselineSections(await communityRes.json());

    hubConfig.apiBase = "";
    if (configRes.ok) {
      try {
        /** @type {{ apiBase?: string }} */
        const c = await configRes.json();
        hubConfig.apiBase = (c.apiBase || "").trim();
      } catch {
        /* ignore */
      }
    }

    const submissions = await fetchSubmissionsEntries();
    await applyMergedFromEntries(submissions);
  }

  function updateToolbarForTab() {
    if (!btnRegisterTab) return;
    btnRegisterTab.textContent = "등록";
    btnRegisterTab.setAttribute(
      "aria-label",
      activeSpace === "overseas"
        ? "해외 참고 링크 탭에 등록"
        : "게시글 초안 탭에 등록"
    );
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

  /** @param {'overseas' | 'community'} space @param {boolean} [writeHash] */
  function switchSpace(space, writeHash) {
    activeSpace = space;
    localStorage.setItem(TAB_KEY, space);
    updateTabUI();
    buildNav();
    buildSections();
    filterResources();
    updateToolbarForTab();
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

  /** @returns {{ start: number, end: number } | null} */
  function getRangeBoundsMs() {
    const s = rangeStartInp?.value?.trim();
    const e = rangeEndInp?.value?.trim();
    if (!s || !e) return null;
    let a = parseLocalDayStartMs(s);
    let b = parseLocalDayEndMs(e);
    if (Number.isNaN(a) || Number.isNaN(b)) return null;
    if (a > b) {
      a = parseLocalDayStartMs(e);
      b = parseLocalDayEndMs(s);
      if (Number.isNaN(a) || Number.isNaN(b)) return null;
    }
    return { start: a, end: b };
  }

  function initDateFilters() {
    const wrap = document.getElementById("period-filter");
    if (!wrap) return;

    function persistRangeStorage() {
      if (rangeStartInp?.value)
        localStorage.setItem(RANGE_START_KEY, rangeStartInp.value);
      if (rangeEndInp?.value)
        localStorage.setItem(RANGE_END_KEY, rangeEndInp.value);
    }

    const rs = localStorage.getItem(RANGE_START_KEY);
    const re = localStorage.getItem(RANGE_END_KEY);
    const hasSaved =
      rs &&
      re &&
      /^\d{4}-\d{2}-\d{2}$/.test(rs) &&
      /^\d{4}-\d{2}-\d{2}$/.test(re);

    if (hasSaved) {
      if (rangeStartInp) rangeStartInp.value = rs;
      if (rangeEndInp) rangeEndInp.value = re;
    } else {
      applyPeriodPresetToInputs(30);
      persistRangeStorage();
    }

    wrap.querySelectorAll("[data-period-days]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const d = parseInt(btn.getAttribute("data-period-days") || "30", 10);
        if (!PERIOD_ALLOWED.includes(d)) return;
        applyPeriodPresetToInputs(d);
        persistRangeStorage();
        syncPeriodChipHighlight();
        filterResources();
      });
    });

    function onRangeChange() {
      persistRangeStorage();
      syncPeriodChipHighlight();
      filterResources();
    }

    rangeStartInp?.addEventListener("change", onRangeChange);
    rangeEndInp?.addEventListener("change", onRangeChange);

    syncPeriodChipHighlight();
  }

  /** @param {Element} itemEl */
  function itemPassesDateFilter(itemEl) {
    const raw = itemEl.getAttribute("data-posted-at");
    if (!raw) return true;
    const t = Date.parse(raw);
    if (Number.isNaN(t)) return true;
    const bounds = getRangeBoundsMs();
    if (!bounds) return true;
    return t >= bounds.start && t <= bounds.end;
  }

  function syncSectionCountsAndNav() {
    const secs = document.querySelectorAll("#catalog [data-section]");
    const navCounts = document.querySelectorAll("#nav-desktop .nav-count");
    secs.forEach((sec, i) => {
      const vis = sec.querySelectorAll(".resource-item:not(.hidden)").length;
      const ce = sec.querySelector(".section-count");
      if (ce) ce.textContent = `${vis}개`;
      const nc = navCounts[i];
      if (nc) nc.textContent = String(vis);
    });
  }

  /**
   * @param {CatalogItem} it
   * @param {Section} section
   */
  function renderItemLi(it, section) {
    const lower = `${it.title} ${it.desc || ""}`.toLowerCase();

    const hasSub =
      !!(it.submissionId && typeof it.submissionId === "string");

    const postedAttr =
      it.postedAt && String(it.postedAt).trim()
        ? ` data-posted-at="${escapeAttr(String(it.postedAt).trim())}"`
        : "";

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
      return `<li class="resource-item" data-text="${escapeAttr(lower)}"${postedAttr}>
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
    )}"${postedAttr}>
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

      const subtitleHtml =
        section.subtitle && String(section.subtitle).trim()
          ? `<p class="section-subtitle">${escapeHtml(section.subtitle)}</p>`
          : "";

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
              <span class="section-count">${section.items.length}개</span>
            </div>
            ${subtitleHtml}
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
    const sections = [...document.querySelectorAll("#catalog [data-section]")];

    sections.forEach((sec) => {
      let visibleItems = 0;
      const items = sec.querySelectorAll(".resource-item");

      items.forEach((item) => {
        const hay = item.getAttribute("data-text") || "";
        const textOk = !q || hay.includes(q);
        const dateOk = itemPassesDateFilter(item);
        const ok = textOk && dateOk;
        item.classList.toggle("hidden", !ok);
        if (ok) visibleItems++;
      });

      const hideSec = visibleItems === 0;
      sec.classList.toggle("hidden", hideSec);

      if (q !== "" && visibleItems > 0) {
        const tr = sec.querySelector(".section-trigger");
        if (tr) setSectionOpen(/** @type {HTMLElement} */ (tr), true);
      }
    });

    syncSectionCountsAndNav();

    const totalVisibleItems = document.querySelectorAll(
      "#catalog .resource-item:not(.hidden)"
    ).length;

    if (searchCountEl) {
      const rawQ = (searchEl?.value || "").trim();
      if (rawQ) {
        searchCountEl.textContent = `표시 중: ${totalVisibleItems}개 · "${rawQ}"`;
      } else if (totalVisibleItems > 0) {
        searchCountEl.textContent = `표시 중: ${totalVisibleItems}개`;
      } else {
        searchCountEl.textContent = "";
      }
    }

    if (totalVisibleItems === 0 && catalogEl) {
      let empty = catalogEl.querySelector(".empty-state");
      if (!empty) {
        empty = document.createElement("p");
        empty.className = "empty-state";
        empty.textContent =
          "조건에 맞는 항목이 없습니다. 검색어나 기간을 바꿔 보세요.";
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
      updateToolbarForTab();
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

    return communityRowsRaw.map((s) => ({
      id: s.id,
      label: `${s.emoji} ${s.title}`,
    }));
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
        `<strong>등록 API 가 설정되지 않았습니다.</strong> <code>data/config.json</code> 의 <code>apiBase</code>에 등록 API 서버 주소를 넣으세요. 브라우저에서 호출하려면 해당 서버의 CORS 설정에 <strong>이 사이트의 주소(출처)</strong>를 허용해야 합니다.`;
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

    btnRegisterTab?.addEventListener("click", () => openRegisterDialog());

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
          )}</p><p>로컬에서 파일만 직접 연 경우 브라우저가 데이터 요청을 막을 수 있습니다. 간단한 로컬 웹 서버로 같은 폴더를 연 뒤 다시 시도해 보세요.</p></div>`;
      return;
    }

    applyTabFromHashOrStorage();
    initTheme();
    initTabs();
    initRegisterEditDeleteUi();
    updateTabUI();
    initSearchOnce();
    initDateFilters();
    buildNav();
    buildSections();
    updateToolbarForTab();
    applyHashFromLocation(false);
  }

  bootstrap();
})();
