(function () {
  "use strict";

  const TAB_KEY = "ax-hub-space";

  /** @param {ParentNode | null | undefined} root */
  function lucideRefresh(root) {
    const L =
      /** @type {{ createIcons?: (opts?: Record<string, unknown>) => void }} */ (
        window
      ).lucide;
    if (!L || typeof L.createIcons !== "function") return;
    try {
      if (root) L.createIcons({ nodes: [root] });
      else L.createIcons();
    } catch {
      try {
        L.createIcons();
      } catch {
        /* ignore */
      }
    }
  }

  /** @typedef {{ id: string, emoji: string, title: string, subtitle: string, parentId?: string }} CatDefRow */

  /**
   * @param {CatDefRow[]} defs
   * @returns {{ d: CatDefRow, depth: number }[]}
   */
  function orderCategoryDefsForManage(defs) {
    const byId = new Map(defs.map((d) => [d.id, d]));
    const roots = defs.filter((d) => !d.parentId || !byId.get(d.parentId));
    roots.sort((a, b) => a.title.localeCompare(b.title, "ko"));
    /** @type {{ d: CatDefRow, depth: number }[]} */
    const out = [];
    function walk(/** @type {CatDefRow} */ d, depth) {
      out.push({ d, depth });
      const kids = defs.filter((x) => x.parentId === d.id);
      kids.sort((a, b) => a.title.localeCompare(b.title, "ko"));
      for (const k of kids) walk(k, depth + 1);
    }
    for (const r of roots) walk(r, 0);
    return out;
  }

  /** @typedef {{ id: string, emoji: string, title: string, subtitle: string, parentId?: string, items: CatalogItem[] }} Section */
  /** @typedef {{ title: string, desc?: string, url: string, bodyMd?: string, submissionId?: string, postedAt?: string, isArticle?: boolean, enabled?: boolean, referenceUrls?: string[], relatedOverseasIds?: string[], publishLocation?: string }} CatalogItem */

  /** @typedef {{ id: string, space: string, categoryId: string, title: string, desc?: string, url?: string, bodyMd?: string, createdAt?: string, updatedAt?: string, enabled?: boolean, referenceUrls?: string[], relatedOverseasIds?: string[], publishLocation?: string }} SubmissionEntry */

  /** @type {{ version?: number, entries: SubmissionEntry[], categories: { overseas: unknown, community: unknown } }} */
  let rawSubmissionsData = {
    version: 2,
    entries: [],
    categories: { overseas: null, community: null },
  };

  /** @type {{ overseas: Section[], community: Section[] } | null} */
  let datasets = null;

  /** @type {'overseas' | 'community'} */
  let activeSpace = "overseas";

  /** @type {'seed' | 'catalog' | 'post-detail'} */
  let appView = "seed";

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
  const navOverseas = document.getElementById("nav-overseas");
  const navPosts = document.getElementById("nav-posts");
  const brandHome = document.getElementById("brand-home");
  const controlDeck = document.getElementById("control-deck");
  const viewSeed = document.getElementById("view-seed");
  const catalogShell = document.getElementById("catalog-shell");
  const viewPostDetail = document.getElementById("view-post-detail");
  const postDetailBody = document.getElementById("post-detail-body");
  const postDetailBack = document.getElementById("post-detail-back");
  const filterActive = /** @type {HTMLSelectElement | null} */ (
    document.getElementById("filter-active")
  );
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
  const regBodyMd = /** @type {HTMLTextAreaElement | null} */ (
    document.getElementById("reg-body-md")
  );
  const regBlockOverseas = document.getElementById("reg-block-overseas");
  const regBlockCommunity = document.getElementById("reg-block-community");
  const regApiHint = document.getElementById("reg-api-hint");
  const regReferenceUrls = /** @type {HTMLTextAreaElement | null} */ (
    document.getElementById("reg-reference-urls")
  );
  const regPublishLocation = /** @type {HTMLInputElement | null} */ (
    document.getElementById("reg-publish-location")
  );
  const regRelatedOverseas = /** @type {HTMLSelectElement | null} */ (
    document.getElementById("reg-related-overseas")
  );
  const regEnabled = /** @type {HTMLInputElement | null} */ (
    document.getElementById("reg-enabled")
  );

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
  const editBodyMd = /** @type {HTMLTextAreaElement | null} */ (
    document.getElementById("edit-body-md")
  );
  const editBlockBody = document.getElementById("edit-block-body");
  const editBlockCommunityExtra = document.getElementById(
    "edit-block-community-extra"
  );
  const editReferenceUrls = /** @type {HTMLTextAreaElement | null} */ (
    document.getElementById("edit-reference-urls")
  );
  const editPublishLocation = /** @type {HTMLInputElement | null} */ (
    document.getElementById("edit-publish-location")
  );
  const editRelatedOverseas = /** @type {HTMLSelectElement | null} */ (
    document.getElementById("edit-related-overseas")
  );
  const editEnabled = /** @type {HTMLInputElement | null} */ (
    document.getElementById("edit-enabled")
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

  const dlgCatEdit = document.getElementById("dlg-cat-edit");
  const formCatEdit =
    /** @type {HTMLFormElement | null} */ (document.getElementById("form-cat-edit"));
  const catEditId = /** @type {HTMLInputElement | null} */ (
    document.getElementById("cat-edit-id")
  );
  const catEditEmoji = /** @type {HTMLInputElement | null} */ (
    document.getElementById("cat-edit-emoji")
  );
  const catEditTitle = /** @type {HTMLInputElement | null} */ (
    document.getElementById("cat-edit-title")
  );
  const catEditSubtitle = /** @type {HTMLInputElement | null} */ (
    document.getElementById("cat-edit-subtitle")
  );
  const catEditPw = /** @type {HTMLInputElement | null} */ (
    document.getElementById("cat-edit-pw")
  );
  const btnManageCategories = document.getElementById("btn-manage-categories");
  const dlgCatManage = document.getElementById("dlg-cat-manage");
  const catManageScope = document.getElementById("cat-manage-scope");
  const catManageList = document.getElementById("cat-manage-list");
  const btnCatManageAdd = document.getElementById("cat-manage-add");
  const catEditParent = /** @type {HTMLSelectElement | null} */ (
    document.getElementById("cat-edit-parent")
  );

  /** @type {"edit"|"add"} */
  let categoryDialogMode = "edit";

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
    if (rangeStartInp) {
      rangeStartInp.value = start;
      rangeStartInp.dispatchEvent(new Event("input", { bubbles: true }));
      rangeStartInp.dispatchEvent(new Event("change", { bubbles: true }));
    }
    if (rangeEndInp) {
      rangeEndInp.value = end;
      rangeEndInp.dispatchEvent(new Event("input", { bubbles: true }));
      rangeEndInp.dispatchEvent(new Event("change", { bubbles: true }));
    }
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
      /** @type {{ entries?: unknown, categories?: unknown }} */
      const j = await r.json();
      rawSubmissionsData.version =
        typeof j.version === "number" ? j.version : 2;
      rawSubmissionsData.entries = Array.isArray(j.entries)
        ? /** @type {SubmissionEntry[]} */ (j.entries)
        : [];
      if (j.categories && typeof j.categories === "object") {
        const cg = /** @type {Record<string, unknown>} */ (j.categories);
        rawSubmissionsData.categories = {
          overseas: cg.overseas !== undefined ? cg.overseas : null,
          community: cg.community !== undefined ? cg.community : null,
        };
      } else {
        rawSubmissionsData.categories = { overseas: null, community: null };
      }
      return rawSubmissionsData.entries;
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

  function stripForSearchBlob(s) {
    if (!s) return "";
    return String(s)
      .replace(/```[\s\S]*?```/g, " ")
      .replace(/`([^`]+)`/g, "$1")
      .replace(/[#*_[\]()]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  /**
   * @param {string} md
   */
  function renderMarkdownSafe(md) {
    if (!md || !String(md).trim()) return "";
    try {
      const g = /** @type {{ marked?: { parse: (x: string, o?: object) => string }, DOMPurify?: { sanitize: (x: string) => string } }} */ (
        window
      );
      if (g.marked) {
        let html = "";
        if (typeof g.marked.parse === "function")
          html = g.marked.parse(String(md), { breaks: true });
        else if (typeof g.marked === "function")
          html = /** @type {(s: string) => string} */ (g.marked)(String(md));
        if (html) {
          if (g.DOMPurify && typeof g.DOMPurify.sanitize === "function")
            return g.DOMPurify.sanitize(html);
          return html;
        }
      }
    } catch {
      /* ignore */
    }
    return `<p class="md-fallback">${escapeHtml(String(md))}</p>`;
  }

  function isHttpUrl(s) {
    try {
      const u = new URL(s);
      return u.protocol === "http:" || u.protocol === "https:";
    } catch {
      return false;
    }
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
      return {
        ...s,
        // baseline json은 "카테고리(목차) 정의"만 제공하고,
        // 실제 링크/게시글 목록(items)은 server의 `public-submissions.json`(entries)에서만 관리합니다.
        items: [],
      };
    });
  }

  /**
   * 저장된 categories 배열이 있으면 그 정의로 섹션을 구성하고, 항목은 같은 id의 baseline에서 붙입니다.
   * @param {Section[]} baseline
   * @param {unknown} overrides
   * @returns {Section[]}
   */
  function mergeCategoryDefs(baseline, overrides) {
    const base = baseline.map((s) =>
      /** @type {Section} */ (JSON.parse(JSON.stringify(s)))
    );
    if (!Array.isArray(overrides) || overrides.length === 0) return base;
    const byId = new Map(base.map((s) => [s.id, s]));
    const ovIds = overrides
      .map((raw) => {
        const x = /** @type {Record<string, unknown>} */ (raw);
        return typeof x.id === "string" ? x.id.trim() : "";
      })
      .filter(Boolean);
    const allCatIds = new Set([...base.map((s) => s.id), ...ovIds]);
    return overrides.map((raw) => {
      const o = /** @type {Record<string, unknown>} */ (raw);
      const id = typeof o.id === "string" ? o.id.trim() : "";
      const prev = id ? byId.get(id) : undefined;
      const items =
        prev && Array.isArray(prev.items)
          ? JSON.parse(JSON.stringify(prev.items))
          : [];
      const cid =
        typeof o.parentId === "string" ? o.parentId.trim() : "";
      const parentId =
        cid && cid !== id && allCatIds.has(cid) ? cid : "";

      return {
        id:
          id ||
          `c-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
        emoji:
          typeof o.emoji === "string" && o.emoji.trim()
            ? o.emoji.trim()
            : prev?.emoji || "📌",
        title:
          typeof o.title === "string" && o.title.trim()
            ? o.title.trim()
            : prev?.title || id || "카테고리",
        subtitle:
          typeof o.subtitle === "string" ? o.subtitle : prev?.subtitle || " ",
        ...(parentId ? { parentId } : {}),
        items,
      };
    });
  }

  /** @param {'overseas'|'community'} space */
  function getCategoryDefsForSave(space) {
    const src = space === "overseas" ? baselineOverseasArr : communityRowsRaw;
    return src
      .filter((s) => s.id !== "user-orphan")
      .map((s) => ({
        id: s.id,
        emoji: s.emoji,
        title: s.title,
        subtitle: s.subtitle || " ",
        ...(s.parentId ? { parentId: s.parentId } : {}),
      }));
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
    one(dlgCatManage);
    one(dlgCatEdit);
  }

  /**
   * 등록·수정·삭제 API 베이스 URL.
   * 1) data/config.json 의 apiBase
   * 2) head 안 meta[name="ax-api-base"]
   * 3) http(s) 로 열었을 때만: 현재 페이지 origin (정적·API가 같은 호스트면 설정 생략)
   */
  function apiOrigin() {
    const fromConfig = (hubConfig.apiBase || "").trim().replace(/\/$/, "");
    if (fromConfig) return fromConfig;
    const metaEl = document.querySelector('meta[name="ax-api-base"]');
    const fromMeta = (metaEl?.getAttribute("content") || "")
      .trim()
      .replace(/\/$/, "");
    if (fromMeta) return fromMeta;
    if (
      typeof window !== "undefined" &&
      window.location &&
      /^https?:$/i.test(window.location.protocol || "")
    ) {
      return String(window.location.origin || "").replace(/\/$/, "");
    }
    return "";
  }

  /** API 주소를 쓸 수 없을 때 (file:// 등) 안내 */
  function apiOriginOrAlert(hint) {
    const o = apiOrigin();
    if (o) return o;
    window.alert(
      (hint ? `${hint} ` : "") +
        "등록 API 주소를 알 수 없습니다.\n\n" +
        "· 로컬에서는 미리보기용 웹 서버로 index.html 을 열고(직접 파일 열기 말고), " +
        "또는 data/config.json 의 apiBase 또는 index.html 의 " +
        '<meta name="ax-api-base" content="https://...API서버..." /> 로 주소를 지정하세요.'
    );
    return "";
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
      const bodyMd =
        typeof ce.bodyMd === "string" ? ce.bodyMd.trim() : "";
      if (!title) continue;
      if (ce.space === "community") {
        if (!bodyMd && !url) continue;
      } else if (!url) continue;
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
      const bodyMd =
        typeof e.bodyMd === "string" ? e.bodyMd.trim() : "";
      const cat = typeof e.categoryId === "string" ? e.categoryId.trim() : "";
      if (spaceKey === "community") {
        if (!title || (!bodyMd && !url)) continue;
      } else {
        if (!title || !url) continue;
      }

      const sec = cat ? sections.find((s) => s.id === cat) : null;
      /** @type {CatalogItem} */
      const item = {
        title: e.title || "",
        desc: typeof e.desc === "string" ? e.desc : "",
        url: url || "",
        submissionId: String(e.id),
      };
      if (bodyMd) {
        item.bodyMd = bodyMd;
        item.isArticle = true;
      }
      if (e.enabled === false) item.enabled = false;
      if (Array.isArray(e.referenceUrls) && e.referenceUrls.length) {
        item.referenceUrls = e.referenceUrls.filter(
          (u) => typeof u === "string" && u.trim()
        );
      }
      if (Array.isArray(e.relatedOverseasIds) && e.relatedOverseasIds.length) {
        item.relatedOverseasIds = e.relatedOverseasIds.filter(
          (x) => typeof x === "string" && x.trim()
        );
      }
      if (typeof e.publishLocation === "string" && e.publishLocation.trim()) {
        item.publishLocation = e.publishLocation.trim();
      }
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
    try {
      await loadDatasets();
    } catch {
      await fetchSubmissionsEntries();
      await applyMergedFromEntries(rawSubmissionsData.entries);
    }
    buildNav();
    buildSections();
    observeNavFresh();
    filterResources();
    const rh = window.location.hash.slice(1);
    if (rh.startsWith("post-")) renderPostDetail(rh.slice(5));
    if (catalogEl) lucideRefresh(catalogEl);
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

    const overseasJson = await overseasRes.json();
    const communityJson = await communityRes.json();

    await fetchSubmissionsEntries();

    const baseO = normalizeBaselineSections(overseasJson);
    const baseC = normalizeBaselineSections(communityJson);
    baselineOverseasArr = mergeCategoryDefs(
      baseO,
      rawSubmissionsData.categories.overseas
    );
    communityRowsRaw = mergeCategoryDefs(
      baseC,
      rawSubmissionsData.categories.community
    );

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

    await applyMergedFromEntries(rawSubmissionsData.entries);
  }

  function updateToolbarForTab() {
    if (!btnRegisterTab) return;
    btnRegisterTab.textContent = "등록";
    btnRegisterTab.setAttribute(
      "aria-label",
      activeSpace === "overseas"
        ? "해외 참고 링크에 등록"
        : "게시글 초안에 등록"
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
    const icon = isDark ? "sun" : "moon";
    themeBtn.innerHTML = `<i data-lucide="${icon}" class="lucide-icon lucide-icon--theme" aria-hidden="true"></i>`;
    lucideRefresh(themeBtn);
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

  function setHeaderNavActive() {
    navOverseas?.removeAttribute("aria-current");
    navPosts?.removeAttribute("aria-current");
    if (appView === "catalog" && activeSpace === "overseas")
      navOverseas?.setAttribute("aria-current", "page");
    if (appView === "catalog" && activeSpace === "community")
      navPosts?.setAttribute("aria-current", "page");
    if (navOverseas)
      navOverseas.setAttribute(
        "data-active",
        appView === "catalog" && activeSpace === "overseas" ? "true" : "false"
      );
    if (navPosts)
      navPosts.setAttribute(
        "data-active",
        appView === "catalog" && activeSpace === "community" ? "true" : "false"
      );
  }

  function showViewSeed() {
    appView = "seed";
    if (viewSeed) viewSeed.hidden = false;
    if (catalogShell) catalogShell.hidden = true;
    if (viewPostDetail) viewPostDetail.hidden = true;
    if (controlDeck) controlDeck.hidden = true;
    setHeaderNavActive();
  }

  function showViewCatalog(/** @type {'overseas'|'community'} */ space) {
    activeSpace = space;
    localStorage.setItem(TAB_KEY, space);
    appView = "catalog";
    if (viewSeed) viewSeed.hidden = true;
    if (catalogShell) catalogShell.hidden = false;
    if (viewPostDetail) viewPostDetail.hidden = true;
    if (controlDeck) controlDeck.hidden = false;
    setHeaderNavActive();
    buildNav();
    buildSections();
    filterResources();
    observeNavFresh();
    updateToolbarForTab();
    if (dlgCatManage?.classList.contains("modal--open")) {
      if (catManageScope) {
        catManageScope.textContent =
          activeSpace === "overseas"
            ? "현재: 해외 참고 링크 — 이 영역 전용 카테고리입니다."
            : "현재: 게시글 초안 — 이 영역 전용 카테고리입니다.";
      }
      renderCategoryManageList();
    }
  }

  function showViewPostDetail() {
    appView = "post-detail";
    if (viewSeed) viewSeed.hidden = true;
    if (catalogShell) catalogShell.hidden = true;
    if (viewPostDetail) viewPostDetail.hidden = false;
    if (controlDeck) controlDeck.hidden = true;
    setHeaderNavActive();
  }

  /**
   * @param {Section[]} list
   * @returns {{ section: Section, depth: number }[]}
   */
  function orderSectionsForNav(list) {
    const byId = new Map(list.map((s) => [s.id, s]));
    const roots = list.filter((s) => !s.parentId || !byId.has(s.parentId));
    roots.sort((a, b) => a.title.localeCompare(b.title, "ko"));
    /** @type {{ section: Section, depth: number }[]} */
    const out = [];
    function walk(/** @type {Section} */ node, /** @type {number} */ depth) {
      out.push({ section: node, depth });
      const kids = list.filter((s) => s.parentId === node.id);
      kids.sort((a, b) => a.title.localeCompare(b.title, "ko"));
      for (const k of kids) walk(k, depth + 1);
    }
    for (const r of roots) walk(r, 0);
    return out;
  }

  function buildNav() {
    const SECTIONS = getSections().filter((s) => s.id !== "user-orphan");
    const orphanSec = getSections().find((s) => s.id === "user-orphan");
    /** @type {{ section: Section, depth: number }[]} */
    let ordered = orderSectionsForNav(SECTIONS);
    if (orphanSec && orphanSec.items.length)
      ordered = ordered.concat([{ section: orphanSec, depth: 0 }]);

    if (!navDesktop) return;
    navDesktop.innerHTML = ordered
      .map(
        ({ section: s, depth }) =>
          `<li class="nav-li nav-li--depth-${depth}" style="--nav-depth:${depth}"><a class="nav-link" href="#${escapeAttr(
            sectionDomId(activeSpace, s)
          )}" data-section-id="${escapeAttr(s.id)}">
          <span class="nav-emoji">${escapeHtml(s.emoji)}</span>
          <span class="nav-text">${escapeHtml(s.title)}</span>
          <span class="nav-count">${s.items.length}</span>
        </a></li>`
      )
      .join("");

    if (navMobile) {
      const allForMobile = getSections();
      navMobile.innerHTML =
        `<option value="">카테고리로 이동…</option>` +
        allForMobile
          .map(
            (s) =>
              `<option value="#${escapeAttr(
                sectionDomId(activeSpace, s)
              )}">${escapeHtml(s.emoji + " " + s.title)}</option>`
          )
          .join("");
    }
  }

  function initSearchOnce() {
    if (searchBound) return;
    searchBound = true;
    searchEl?.addEventListener("input", filterResources);
    filterActive?.addEventListener("change", filterResources);
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
    secs.forEach((sec) => {
      const sid = sec.getAttribute("data-section-id");
      const vis = sec.querySelectorAll(".resource-item:not(.hidden)").length;
      const ce = sec.querySelector(".section-count");
      if (ce) ce.textContent = `${vis}개`;
      if (!sid || !navDesktop) return;
      const navA = Array.from(
        navDesktop.querySelectorAll(".nav-link[data-section-id]")
      ).find((a) => a.getAttribute("data-section-id") === sid);
      const nc = navA?.querySelector(".nav-count");
      if (nc) nc.textContent = String(vis);
    });
  }

  /**
   * @param {CatalogItem} it
   * @param {Section} section
   */
  function renderItemLi(it, section) {
    const lower = `${it.title} ${it.desc || ""} ${stripForSearchBlob(
      it.bodyMd || ""
    )}`
      .trim()
      .toLowerCase();

    const hasSub =
      !!(it.submissionId && typeof it.submissionId === "string");

    const postedAttr =
      it.postedAt && String(it.postedAt).trim()
        ? ` data-posted-at="${escapeAttr(String(it.postedAt).trim())}"`
        : "";

    const enabledFlag = it.enabled !== false;
    const enAttr = ` data-enabled="${enabledFlag ? "true" : "false"}"`;

    const inactivePill =
      !enabledFlag && hasSub
        ? `<span class="pill-inactive" title="비활성">비활성</span>`
        : "";

    const isCommunityPost =
      activeSpace === "community" &&
      hasSub &&
      (!!(it.bodyMd && String(it.bodyMd).trim()) ||
        !!(it.url && isHttpUrl(it.url)));

    const subPill = hasSub ? `<span class="pill-sub">등록</span>` : "";

    const btnEdit = `<button type="button" class="btn-mini btn-mini--icon" data-sub-action="edit" data-submission-id="${escapeAttr(
      it.submissionId || ""
    )}" aria-label="수정"><i data-lucide="pencil" class="lucide-18" aria-hidden="true"></i></button>`;
    const btnDel = `<button type="button" class="btn-mini btn-mini--icon btn-mini--danger" data-sub-action="delete" data-submission-id="${escapeAttr(
      it.submissionId || ""
    )}" aria-label="삭제"><i data-lucide="trash-2" class="lucide-18" aria-hidden="true"></i></button>`;

    if (isCommunityPost) {
      const sid = escapeAttr(it.submissionId || "");
      const excerpt =
        (it.desc && String(it.desc).trim()) ||
        stripForSearchBlob(it.bodyMd || "").slice(0, 220) ||
        (it.url ? "참고 링크만 있는 초안" : "");
      const pub =
        it.publishLocation && it.publishLocation.trim()
          ? `<span class="post-summary-meta">${escapeHtml(
              it.publishLocation
            )}</span>`
          : "";
      const actions = hasSub
        ? `<div class="resource-actions resource-actions--post" aria-label="게시글 관리">${btnEdit}${btnDel}</div>`
        : "";
      return `<li class="resource-item resource-item--post-summary${
        hasSub ? " resource-item--with-actions" : ""
      }" data-text="${escapeAttr(lower)}"${postedAttr}${enAttr}>
        <div class="post-summary-row">
          <a class="post-summary-card" href="#post-${sid}">
            <div class="resource-main">
              <div class="resource-title-row">
                <p class="resource-title">${escapeHtml(it.title)}</p>
                ${subPill}
                ${inactivePill}
              </div>
              ${
                excerpt
                  ? `<p class="resource-desc post-summary-excerpt">${escapeHtml(
                      excerpt
                    )}</p>`
                  : ""
              }
              ${pub}
            </div>
            <span class="post-summary-chev" aria-hidden="true">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="m9 18 6-6-6-6"/></svg>
            </span>
          </a>
          ${actions}
        </div>
      </li>`;
    }

    const isArticle =
      activeSpace === "community" &&
      !!(it.bodyMd && String(it.bodyMd).trim()) &&
      !isCommunityPost;

    if (isArticle) {
      const mdHtml = renderMarkdownSafe(it.bodyMd || "");
      const refLines = [];
      if (it.url && isHttpUrl(it.url)) refLines.push(it.url);
      if (Array.isArray(it.referenceUrls))
        refLines.push(
          ...it.referenceUrls.filter((u) => u && isHttpUrl(String(u)))
        );
      const refLink =
        refLines.length > 0
          ? `<ul class="article-ref-list">${refLines
              .map(
                (u) =>
                  `<li><a href="${escapeAttr(u)}" target="_blank" rel="noopener noreferrer">${escapeHtml(
                    u
                  )}</a></li>`
              )
              .join("")}</ul>`
          : "";
      const actions = hasSub
        ? `<div class="resource-actions resource-actions--article" aria-label="게시글 관리">${btnEdit}${btnDel}</div>`
        : "";

      return `<li class="resource-item resource-item--article${
        hasSub ? " resource-item--with-actions" : ""
      }" data-text="${escapeAttr(lower)}"${postedAttr}${enAttr}>
        <div class="resource-article-card">
          <div class="resource-article-body">
            <div class="resource-title-row">
              <p class="resource-title">${escapeHtml(it.title)}</p>
              ${subPill}
              ${inactivePill}
            </div>
            ${
              it.desc
                ? `<p class="resource-desc">${escapeHtml(it.desc)}</p>`
                : ""
            }
            <div class="md-content">${mdHtml}</div>
            ${refLink}
          </div>
          ${actions}
        </div>
      </li>`;
    }

    const linkInner = `
      <div class="resource-main">
        <div class="resource-title-row">
          <p class="resource-title">${escapeHtml(it.title)}</p>
          ${subPill}
          ${inactivePill}
        </div>
        <p class="resource-desc">${escapeHtml(it.desc || "")}</p>
      </div>
      <span class="external-cta" aria-hidden="true">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M7 17L17 7"/><path d="M7 7h10v10"/></svg>
      </span>`;

    const href =
      it.url && isHttpUrl(it.url) ? it.url : "";
    const linkBlock = href
      ? `<a class="resource-link-card" href="${escapeHtml(
          href
        )}" target="_blank" rel="noopener noreferrer">${linkInner}</a>`
      : `<div class="resource-link-card resource-link-card--static">${linkInner}</div>`;

    if (!hasSub) {
      return `<li class="resource-item" data-text="${escapeAttr(lower)}"${postedAttr}${enAttr}>
        ${linkBlock}
      </li>`;
    }

    const sid = escapeAttr(it.submissionId || "");
    const actions = `<div class="overseas-link-toolbar" aria-label="링크 관리"><button type="button" class="btn-mini btn-mini--icon" data-sub-action="edit" data-submission-id="${sid}" aria-label="수정"><i data-lucide="pencil" class="lucide-18" aria-hidden="true"></i></button><button type="button" class="btn-mini btn-mini--icon btn-mini--danger" data-sub-action="delete" data-submission-id="${sid}" aria-label="삭제"><i data-lucide="trash-2" class="lucide-18" aria-hidden="true"></i></button></div>`;

    const mainLink = href
      ? `<a class="resource-link-card resource-link-card--full" href="${escapeHtml(
          href
        )}" target="_blank" rel="noopener noreferrer">${linkInner}</a>`
      : `<div class="resource-link-card resource-link-card--full resource-link-card--static">${linkInner}</div>`;

    return `<li class="resource-item resource-item--overseas-registered" data-text="${escapeAttr(
      lower
    )}"${postedAttr}${enAttr}>
      <div class="overseas-registered-wrap">
        ${mainLink}
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
      const parentLine =
        section.parentId &&
        SECTIONS.some((s) => s.id === section.parentId)
          ? (() => {
              const psec = SECTIONS.find((s) => s.id === section.parentId);
              return psec
                ? `<p class="section-hierarchy-hint"><span class="section-hierarchy-label">상위 카테고리</span> · ${escapeHtml(
                    psec.emoji + " " + psec.title
                  )}</p>`
                : "";
            })()
          : "";

      return `<section class="section" id="${escapeAttr(
        secId
      )}" data-section data-section-id="${escapeAttr(section.id)}">
        <h2 class="visually-hidden">${escapeHtml(section.title)}</h2>
        <div class="section-head-row">
          <button type="button" class="section-trigger section-trigger--fill"
          aria-expanded="${expanded}"
          aria-controls="panel-${escapeAttr(secId)}"
          id="heading-${escapeAttr(secId)}">
            <span class="section-icon" aria-hidden="true">${escapeHtml(
              section.emoji
            )}</span>
            <div class="section-heading">
              <div class="section-title-row">
                <p class="section-title">${escapeHtml(section.title)}${
                  section.id === "user-orphan"
                    ? ""
                    : section.parentId
                      ? ` <span class="section-badge-child">하위 카테고리</span>`
                      : ` <span class="section-badge-root">상위 카테고리</span>`
                }</p>
                <span class="section-count">${section.items.length}개</span>
              </div>
              ${parentLine}
              ${subtitleHtml}
            </div>
            <span class="chevron" aria-hidden="true">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/></svg>
            </span>
          </button>
        </div>
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
    if (catalogEl) lucideRefresh(catalogEl);
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
        const mode = (filterActive?.value || "all").trim();
        const en = item.getAttribute("data-enabled");
        const isAct = en !== "false";
        let activeOk = true;
        if (mode === "active") activeOk = isAct;
        else if (mode === "inactive") activeOk = !isAct;
        const ok = textOk && dateOk && activeOk;
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
          "조건에 맞는 항목이 없습니다. 검색·기간·활성화 필터를 바꿔 보세요.";
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

  function renderPostDetail(/** @type {string} */ id) {
    const entry = lastSubmissionEntries.find((e) => e.id === id);
    if (!entry || entry.space !== "community" || !postDetailBody) {
      window.alert("게시글을 찾을 수 없습니다. 목록으로 돌아갑니다.");
      history.replaceState(null, "", "#posts");
      showViewCatalog("community");
      return;
    }
    const catRow = communityRowsRaw.find((s) => s.id === entry.categoryId);
    const catLabel = catRow
      ? `${catRow.emoji} ${catRow.title}`
      : entry.categoryId || "";
    const mdHtml = renderMarkdownSafe(
      typeof entry.bodyMd === "string" ? entry.bodyMd : ""
    );
    /** @type {string[]} */
    const refs = [];
    if (entry.url && isHttpUrl(String(entry.url)))
      refs.push(String(entry.url).trim());
    if (Array.isArray(entry.referenceUrls))
      refs.push(
        ...entry.referenceUrls.filter((u) => u && isHttpUrl(String(u)))
      );
    const refBlock =
      refs.length > 0
        ? `<section class="pd-block"><h3 class="pd-h">참고 링크</h3><ul class="article-ref-list">${refs
            .map(
              (u) =>
                `<li><a href="${escapeAttr(u)}" target="_blank" rel="noopener noreferrer">${escapeHtml(
                  u
                )}</a></li>`
            )
            .join("")}</ul></section>`
        : "";
    let relBlock = "";
    if (
      Array.isArray(entry.relatedOverseasIds) &&
      entry.relatedOverseasIds.length
    ) {
      const lis = entry.relatedOverseasIds
        .map((rid) => {
          const oe = lastSubmissionEntries.find(
            (x) => x.id === rid && x.space === "overseas"
          );
          if (!oe || !oe.url || !isHttpUrl(String(oe.url))) return "";
          const u = String(oe.url).trim();
          return `<li><a href="${escapeAttr(
            u
          )}" target="_blank" rel="noopener noreferrer">${escapeHtml(
            oe.title || u
          )}</a></li>`;
        })
        .filter(Boolean);
      if (lis.length)
        relBlock = `<section class="pd-block"><h3 class="pd-h">연관 해외 레퍼런스</h3><ul class="article-ref-list">${lis.join(
          ""
        )}</ul></section>`;
    }
    const loc =
      entry.publishLocation && String(entry.publishLocation).trim()
        ? `<p class="pd-loc"><strong>게시 위치</strong> · ${escapeHtml(
            String(entry.publishLocation).trim()
          )}</p>`
        : "";
    const en =
      entry.enabled === false
        ? `<p class="pd-flag"><span class="pill-inactive">비활성</span></p>`
        : "";
    postDetailBody.innerHTML = `
      <header class="pd-head">
        <p class="pd-cat">${escapeHtml(catLabel)}</p>
        <h1 class="pd-title">${escapeHtml(entry.title || "")}</h1>
        ${
          entry.desc
            ? `<p class="pd-desc">${escapeHtml(String(entry.desc))}</p>`
            : ""
        }
        ${loc}
        ${en}
      </header>
      <div class="pd-md md-content">${mdHtml || ""}</div>
      ${refBlock}
      ${relBlock}
    `;
    showViewPostDetail();
  }

  function applyRouteFromHash(/** @type {boolean} */ smoothScroll) {
    const raw = window.location.hash.slice(1);
    if (raw.startsWith("post-")) {
      renderPostDetail(raw.slice(5));
      return;
    }
    if (!raw || raw === "seed") {
      showViewSeed();
      return;
    }

    /** @type {'overseas'|'community'} */
    let space = "overseas";
    if (
      raw === "posts" ||
      raw === "tab-community" ||
      raw === "community" ||
      raw.startsWith("c-")
    ) {
      space = "community";
    } else if (
      raw === "overseas" ||
      raw === "tab-overseas" ||
      raw.startsWith("o-")
    ) {
      space = "overseas";
    } else {
      const stored = localStorage.getItem(TAB_KEY);
      if (stored === "community" || stored === "overseas") space = stored;
    }

    showViewCatalog(space);

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

  postDetailBack?.addEventListener("click", () => {
    history.replaceState(null, "", "#posts");
    applyRouteFromHash(false);
  });

  window.addEventListener("hashchange", () => applyRouteFromHash(true));

  /* --- 카테고리 옵션 (등록/수정) --- */

  /**
   * @param {'overseas'|'community'} space
   * @returns {{ id: string; label: string }[]}
   */
  function getCategoryChoices(space) {
    const arr = space === "overseas" ? baselineOverseasArr : communityRowsRaw;
    const list = arr.filter((s) => s.id !== "user-orphan");
    return orderSectionsForNav(list).map(({ section, depth }) => ({
      id: section.id,
      label: `${"\u2003".repeat(depth)}${section.emoji} ${section.title}`,
    }));
  }

  function fillRelatedOverseasSelect(
    /** @type {HTMLSelectElement | null} */ sel,
    /** @type {string[] | undefined} */ selectedIds
  ) {
    if (!sel) return;
    const set = new Set(selectedIds || []);
    const picks = lastSubmissionEntries.filter((x) => x.space === "overseas");
    sel.innerHTML = picks
      .map((x) => {
        const selAttr = set.has(x.id) ? " selected" : "";
        return `<option value="${escapeAttr(x.id)}"${selAttr}>${escapeHtml(
          x.title || x.id
        )}</option>`;
      })
      .join("");
  }

  function fillCatEditParentSelect(
    /** @type {string} */ excludeId,
    /** @type {string | undefined} */ selectedParentId
  ) {
    if (!catEditParent) return;
    const defs = getCategoryDefsForSave(activeSpace);
    catEditParent.innerHTML =
      `<option value="">${escapeHtml("(없음 — 최상위)")}</option>` +
      defs
        .filter((d) => d.id !== excludeId)
        .map((d) => {
          const sel = d.id === selectedParentId ? " selected" : "";
          return `<option value="${escapeAttr(d.id)}"${sel}>${escapeHtml(
            `${d.emoji} ${d.title}`
          )}</option>`;
        })
        .join("");
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
    updateRegisterFormMode();
  }

  function updateRegisterFormMode() {
    const comm = !!regSpaceCommunity?.checked;
    if (regBlockOverseas) regBlockOverseas.hidden = comm;
    if (regBlockCommunity) regBlockCommunity.hidden = !comm;
    if (regUrl) regUrl.required = !comm;
    const h = document.getElementById("dlg-reg-title");
    if (h) h.textContent = comm ? "게시글 초안 등록" : "해외 참고 링크 등록";
  }

  function updateEditFormForEntry(
    /** @type {'overseas'|'community'} */ space,
    /** @type {SubmissionEntry} */ entry
  ) {
    const comm = space === "community";
    if (editBlockBody) editBlockBody.hidden = !comm;
    if (editBlockCommunityExtra) editBlockCommunityExtra.hidden = !comm;
    const editBlockUrl = document.getElementById("edit-block-url");
    if (editBlockUrl) editBlockUrl.hidden = comm;
    if (editUrl) {
      if (comm) editUrl.value = "";
      editUrl.required = !comm;
    }
    if (editBodyMd) {
      editBodyMd.value =
        comm && typeof entry.bodyMd === "string" ? entry.bodyMd : "";
    }
  }

  async function saveCategoriesApi(
    /** @type {'overseas'|'community'} */ space,
    categories,
    password
  ) {
    const origin = apiOriginOrAlert();
    if (!origin) return false;
    try {
      const res = await fetch(`${origin}/api/save-categories`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Admin-Password": password,
        },
        body: JSON.stringify({ space, categories }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok || !j.ok) {
        window.alert(j.error || `저장 실패 (${res.status})`);
        return false;
      }
      return true;
    } catch (err) {
      window.alert(String(/** @type {Error} */ (err).message || err));
      return false;
    }
  }

  function renderCategoryManageList() {
    if (!catManageList) return;
    const defs = getCategoryDefsForSave(activeSpace);
    const sections = getSections().filter((s) => s.id !== "user-orphan");
    const countById = Object.fromEntries(
      sections.map((s) => [s.id, s.items.length])
    );
    if (!defs.length) {
      catManageList.innerHTML =
        `<li class="cat-manage-empty">아직 카테고리가 없습니다. 「카테고리 추가」로 만드세요.</li>`;
      return;
    }
    catManageList.innerHTML = orderCategoryDefsForManage(
      /** @type {CatDefRow[]} */ (defs)
    )
      .map(({ d, depth }) => {
        const n = countById[d.id] ?? 0;
        const sub = (d.subtitle || "").trim();
        const subLine =
          sub && sub !== " "
            ? `<span class="cat-manage-sub">${escapeHtml(sub)}</span>`
            : "";
        const tier =
          depth === 0
            ? `<span class="cat-tier cat-tier--parent">상위</span>`
            : `<span class="cat-tier cat-tier--child">하위</span>`;
        return `<li class="cat-manage-item cat-manage-item--depth-${depth}" style="--cat-depth:${depth}">
      <div class="cat-manage-item-main">
        <span class="cat-manage-emoji" aria-hidden="true">${escapeHtml(
          d.emoji
        )}</span>
        <div class="cat-manage-text">
          <span class="cat-manage-name-row">${tier}<span class="cat-manage-name">${escapeHtml(
            d.title
          )}</span></span>
          ${subLine}
          <span class="cat-manage-meta">ID <code>${escapeHtml(d.id)}</code> · 항목 ${n}개</span>
        </div>
      </div>
      <div class="cat-manage-actions">
        <button type="button" class="btn-mini btn-mini--icon" data-cat-manage="edit" data-cat-id="${escapeAttr(
          d.id
        )}" aria-label="카테고리 수정"><i data-lucide="pencil" class="lucide-18" aria-hidden="true"></i></button>
        <button type="button" class="btn-mini btn-mini--icon btn-mini--danger" data-cat-manage="delete" data-cat-id="${escapeAttr(
          d.id
        )}" aria-label="카테고리 삭제"><i data-lucide="trash-2" class="lucide-18" aria-hidden="true"></i></button>
      </div>
    </li>`;
      })
      .join("");
  }

  function openCategoryManageModal() {
    if (!apiOriginOrAlert("카테고리를 저장하려면")) return;
    if (catManageScope) {
      catManageScope.textContent =
        activeSpace === "overseas"
          ? "현재: 해외 참고 링크 — 이 영역 전용 카테고리 목록입니다."
          : "현재: 게시글 초안 — 이 영역 전용 카테고리 목록입니다.";
    }
    renderCategoryManageList();
    openModal(dlgCatManage);
    lucideRefresh(dlgCatManage);
  }

  function openCategoryEditModal(sectionId) {
    if (!apiOriginOrAlert("카테고리를 저장하려면")) return;
    closeModal(dlgCatManage);
    const defs = getCategoryDefsForSave(activeSpace);
    const row = defs.find((d) => d.id === sectionId);
    if (!row) return;
    categoryDialogMode = "edit";
    if (catEditId) {
      catEditId.value = row.id;
      catEditId.setAttribute("readonly", "");
    }
    if (catEditEmoji) catEditEmoji.value = row.emoji;
    if (catEditTitle) catEditTitle.value = row.title;
    if (catEditSubtitle) catEditSubtitle.value = row.subtitle || "";
    if (catEditPw) catEditPw.value = "";
    fillCatEditParentSelect(row.id, row.parentId);
    const ht = document.getElementById("dlg-cat-title");
    if (ht) ht.textContent = "카테고리 수정";
    openModal(dlgCatEdit);
  }

  function openCategoryAddModal() {
    if (!apiOriginOrAlert("카테고리를 저장하려면")) return;
    closeModal(dlgCatManage);
    categoryDialogMode = "add";
    if (catEditId) {
      catEditId.value = "";
      catEditId.removeAttribute("readonly");
    }
    if (catEditEmoji) catEditEmoji.value = "📌";
    if (catEditTitle) catEditTitle.value = "";
    if (catEditSubtitle) catEditSubtitle.value = " ";
    if (catEditPw) catEditPw.value = "";
    fillCatEditParentSelect("", "");
    const ht = document.getElementById("dlg-cat-title");
    if (ht) ht.textContent = "카테고리 추가";
    openModal(dlgCatEdit);
  }

  async function deleteCategoryFlow(sectionId) {
    if (!apiOriginOrAlert("카테고리를 삭제하려면")) return;
    const sec = getSections().find((s) => s.id === sectionId);
    if (!sec) return;
    if (sec.items.length > 0) {
      window.alert(
        "이 카테고리에 항목이 있으면 삭제할 수 없습니다. 먼저 항목을 옮기거나 삭제하세요."
      );
      return;
    }
    if (!window.confirm("이 카테고리를 삭제할까요?")) return;
    closeModal(dlgCatManage);
    const pw = window.prompt("공용 비밀번호 (팀과 동일한 값)");
    if (!pw) return;
    const defs = getCategoryDefsForSave(activeSpace).filter(
      (d) => d.id !== sectionId
    );
    const ok = await saveCategoriesApi(activeSpace, defs, pw);
    if (ok) {
      await reloadAfterMutation("카테고리가 삭제되었습니다.");
      openCategoryManageModal();
    }
  }

  function updateRegisterHint() {
    if (!regApiHint) return;
    const base = apiOrigin();
    const rawCfg = (hubConfig.apiBase || "").trim();
    const metaEl = document.querySelector('meta[name="ax-api-base"]');
    const rawMeta = (metaEl?.getAttribute("content") || "").trim();
    const explicit = !!(rawCfg || rawMeta);
    if (!base) {
      regApiHint.innerHTML =
        `<strong>등록 API 주소를 알 수 없습니다.</strong> 이 페이지를 <code>http://</code> 또는 <code>https://</code> 로 열거나, ` +
        `<code>data/config.json</code> 의 <code>apiBase</code>에 API 서버 루트 URL 을 넣으세요. ` +
        `브라우저에서 호출하려면 해당 서버 CORS 에 <strong>이 사이트 출처</strong>를 허용해야 합니다.`;
      regApiHint.hidden = false;
      return;
    }
    const note = explicit
      ? ""
      : ` <span class="reg-api-note">(설정 없음 — 지금 보고 있는 주소를 API 로 사용. API가 다른 도메인이면 <code>apiBase</code> 또는 <code>ax-api-base</code> 메타를 지정하세요.)</span>`;
    regApiHint.innerHTML = `등록 API: <code>${escapeHtml(base)}</code>${note}`;
    regApiHint.hidden = false;
  }

  function openRegisterDialog() {
    updateRegisterHint();
    syncRegisterSpaceRadios(activeSpace);
    if (regTitle) regTitle.value = "";
    if (regDesc) regDesc.value = "";
    if (regUrl) regUrl.value = "";
    if (regBodyMd) regBodyMd.value = "";
    if (regReferenceUrls) regReferenceUrls.value = "";
    if (regPublishLocation) regPublishLocation.value = "";
    if (regEnabled) regEnabled.checked = true;
    fillRelatedOverseasSelect(regRelatedOverseas, []);
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
    if (!apiOriginOrAlert("항목을 수정하려면")) return;
    const space =
      entry.space === "community" ? "community" : "overseas";
    if (editId) editId.value = entry.id;

    fillCategorySelect(space, editCategory, entry.categoryId);
    if (editTitle) editTitle.value = entry.title || "";

    if (editDesc)
      editDesc.value = typeof entry.desc === "string" ? entry.desc : "";

    if (space === "overseas" && editUrl)
      editUrl.value = typeof entry.url === "string" ? entry.url : "";

    if (space === "community") {
      /** @type {string[]} */
      const refLines = [];
      if (entry.url && isHttpUrl(String(entry.url)))
        refLines.push(String(entry.url).trim());
      if (Array.isArray(entry.referenceUrls))
        refLines.push(
          ...entry.referenceUrls.map((u) => String(u).trim()).filter(Boolean)
        );
      if (editReferenceUrls)
        editReferenceUrls.value = refLines.join("\n");
      if (editPublishLocation)
        editPublishLocation.value =
          typeof entry.publishLocation === "string" ? entry.publishLocation : "";
      fillRelatedOverseasSelect(
        editRelatedOverseas,
        Array.isArray(entry.relatedOverseasIds)
          ? entry.relatedOverseasIds
          : []
      );
    }

    if (editEnabled) editEnabled.checked = entry.enabled !== false;

    if (editPwd) editPwd.value = "";

    updateEditFormForEntry(space, entry);

    dlgEdit?.setAttribute("data-edit-space", space);
    openModal(dlgEdit);
  }

  /**
   * @param {string} id
   */
  function openDeleteDialog(id) {
    if (!apiOriginOrAlert("항목을 삭제하려면")) return;
    const entry = lastSubmissionEntries.find((e) => e.id === id);
    const hintEl = document.getElementById("delete-context-hint");
    if (hintEl) {
      if (entry?.space === "community") {
        hintEl.innerHTML =
          "<strong>게시글 초안</strong>에 등록된 항목을 삭제합니다. 사라진 뒤에는 복구할 수 없습니다. 공용 비밀번호를 입력하세요.";
      } else if (entry?.space === "overseas") {
        hintEl.innerHTML =
          "<strong>해외 참고 링크</strong>에 등록된 항목을 삭제합니다. 사라진 뒤에는 복구할 수 없습니다. 공용 비밀번호를 입력하세요.";
      } else {
        hintEl.textContent =
          "등록 항목을 삭제합니다. 공용 비밀번호를 입력하세요.";
      }
    }
    if (delId) delId.value = id;
    if (delPwd) delPwd.value = "";
    openModal(dlgDelete);
  }

  function initRegisterEditDeleteUi() {
    wireModals();

    btnRegisterTab?.addEventListener("click", () => openRegisterDialog());

    btnManageCategories?.addEventListener("click", () =>
      openCategoryManageModal()
    );

    btnCatManageAdd?.addEventListener("click", () => {
      closeModal(dlgCatManage);
      openCategoryAddModal();
    });

    catManageList?.addEventListener("click", (ev) => {
      const el = ev.target instanceof Element ? ev.target : null;
      const btn = el?.closest("[data-cat-manage]");
      if (!btn || !(btn instanceof HTMLElement) || !catManageList.contains(btn))
        return;
      const id = btn.getAttribute("data-cat-id");
      const act = btn.getAttribute("data-cat-manage");
      if (!id) return;
      if (act === "edit") {
        openCategoryEditModal(id);
      } else if (act === "delete") {
        void deleteCategoryFlow(id);
      }
    });

    regSpaceOverseas?.addEventListener("change", () => {
      if (regSpaceOverseas?.checked) syncRegisterSpaceRadios("overseas");
    });
    regSpaceCommunity?.addEventListener("change", () => {
      if (regSpaceCommunity?.checked) syncRegisterSpaceRadios("community");
    });

    dlgRegisterForm?.addEventListener("submit", async (ev) => {
      ev.preventDefault();
      const origin = apiOriginOrAlert("등록하려면");
      if (!origin) return;
      const space =
        regSpaceCommunity?.checked ? "community" : "overseas";
      const categoryId = regCategory?.value || "";
      const title = (regTitle?.value || "").trim();
      const desc = (regDesc?.value || "").trim();
      const urlOverseas = (regUrl?.value || "").trim();
      const bodyMd = (regBodyMd?.value || "").trim();
      const refRaw = (regReferenceUrls?.value || "").trim();
      const refLines = refRaw
        ? refRaw
            .split(/\r?\n/)
            .map((s) => s.trim())
            .filter((s) => isHttpUrl(s))
        : [];
      const urlCommunity = refLines[0] || "";
      const refRest =
        space === "community" && refLines.length > 1 ? refLines.slice(1) : [];
      const publishLocation = (regPublishLocation?.value || "").trim();
      const relatedSel = regRelatedOverseas
        ? [...regRelatedOverseas.selectedOptions].map((o) => o.value)
        : [];
      const enabled = regEnabled?.checked !== false;

      if (!categoryId || !title) {
        window.alert("카테고리와 제목은 필수입니다.");
        return;
      }

      if (space === "overseas") {
        if (!urlOverseas) {
          window.alert("URL 을 입력하세요.");
          return;
        }
      } else if (!bodyMd && !urlCommunity) {
        window.alert(
          "게시글: 본문(Markdown) 또는 참고 링크 첫 줄(URL) 중 하나는 필요합니다."
        );
        return;
      }

      try {
        /** @type {Record<string, unknown>} */
        let payload;
        if (space === "overseas") {
          payload = {
            space,
            categoryId,
            title,
            desc,
            url: urlOverseas,
            enabled,
          };
        } else {
          payload = {
            space,
            categoryId,
            title,
            desc,
            url: urlCommunity,
            enabled,
            ...(bodyMd ? { bodyMd } : {}),
            ...(refRest.length ? { referenceUrls: refRest } : {}),
            ...(relatedSel.length ? { relatedOverseasIds: relatedSel } : {}),
            ...(publishLocation ? { publishLocation } : {}),
          };
        }

        const res = await fetch(`${origin}/api/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
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
      const origin = apiOriginOrAlert();
      if (!origin) return;
      const id = (editId?.value || "").trim();
      const pw = (editPwd?.value || "").trim();
      const categoryId = (editCategory?.value || "").trim();
      const title = (editTitle?.value || "").trim();
      const desc = (editDesc?.value || "").trim();
      const urlPlain = (editUrl?.value || "").trim();
      const bodyMd = (editBodyMd?.value || "").trim();
      const dlgSpace = dlgEdit?.getAttribute("data-edit-space");
      const refRaw = (editReferenceUrls?.value || "").trim();
      const refLines = refRaw
        ? refRaw
            .split(/\r?\n/)
            .map((s) => s.trim())
            .filter((s) => isHttpUrl(s))
        : [];
      const urlFromRefs = refLines[0] || "";
      const refRest =
        dlgSpace === "community" && refLines.length > 1 ? refLines.slice(1) : [];
      const publishLoc = (editPublishLocation?.value || "").trim();
      const relatedSel = editRelatedOverseas
        ? [...editRelatedOverseas.selectedOptions].map((o) => o.value)
        : [];
      const enabled = editEnabled?.checked !== false;
      if (!id || !pw) {
        window.alert("공용 비밀번호를 입력하세요.");
        return;
      }
      /** @type {Record<string, unknown>} */
      let payload;
      if (dlgSpace === "community") {
        payload = {
          id,
          categoryId,
          title,
          desc,
          url: urlFromRefs,
          bodyMd,
          enabled,
          referenceUrls: refRest,
          relatedOverseasIds: relatedSel,
          publishLocation: publishLoc,
        };
      } else {
        payload = { id, categoryId, title, desc, url: urlPlain, enabled };
      }
      try {
        const res = await fetch(`${origin}/api/edit`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Admin-Password": pw,
          },
          body: JSON.stringify(payload),
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
      const origin = apiOriginOrAlert();
      if (!origin) return;
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
      ev.stopPropagation();
      const id = btn.getAttribute("data-submission-id");
      const act = btn.getAttribute("data-sub-action");
      if (!id) return;
      if (act === "edit") openEditDialog(id);
      else if (act === "delete") openDeleteDialog(id);
    });

    formCatEdit?.addEventListener("submit", async (ev) => {
      ev.preventDefault();
      const pw = (catEditPw?.value || "").trim();
      const id = (catEditId?.value || "").trim();
      const emoji = (catEditEmoji?.value || "").trim() || "📌";
      const title = (catEditTitle?.value || "").trim();
      const subtitle = (catEditSubtitle?.value || "").trim() || " ";
      if (!pw) {
        window.alert("공용 비밀번호를 입력하세요.");
        return;
      }
      const parentVal = (catEditParent?.value || "").trim();
      let defs = getCategoryDefsForSave(activeSpace);
      if (categoryDialogMode === "add") {
        if (!id || !title) {
          window.alert("ID와 제목은 필수입니다.");
          return;
        }
        if (parentVal === id) {
          window.alert("자기 자신을 상위로 둘 수 없습니다.");
          return;
        }
        /** @type {{ id: string, emoji: string, title: string, subtitle: string, parentId?: string }} */
        const row = { id, emoji, title, subtitle };
        if (parentVal) row.parentId = parentVal;
        if (defs.some((d) => d.id === id)) {
          window.alert("같은 ID 의 카테고리가 이미 있습니다.");
          return;
        }
        defs = defs.concat([row]);
      } else {
        if (!id || !title) {
          window.alert("제목은 필수입니다.");
          return;
        }
        defs = defs.map((d) => {
          if (d.id !== id) return d;
          /** @type {{ id: string, emoji: string, title: string, subtitle: string, parentId?: string }} */
          const next = { id, emoji, title, subtitle };
          if (parentVal && parentVal !== id) next.parentId = parentVal;
          return next;
        });
      }
      const ok = await saveCategoriesApi(activeSpace, defs, pw);
      if (ok) {
        closeModal(dlgCatEdit);
        await reloadAfterMutation("카테고리가 저장되었습니다.");
        openCategoryManageModal();
      }
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

    initTheme();
    initRegisterEditDeleteUi();
    initSearchOnce();
    initDateFilters();
    if (catalogEl && !catalogEl.querySelector("[data-section]"))
      catalogEl.innerHTML = "";
    applyRouteFromHash(false);
    lucideRefresh(document.body);
  }

  bootstrap();
})();
