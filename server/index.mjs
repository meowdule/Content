import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import cors from "cors";
import crypto from "crypto";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, ".env") });

const FILE_PATH =
  process.env.SUBMISSIONS_PATH || "data/public-submissions.json";
const GIT_BRANCH = process.env.GIT_BRANCH || process.env.GITHUB_BRANCH || "main";
const OWNER = process.env.GITHUB_OWNER || "";
const REPO = process.env.GITHUB_REPO || "";
const TOKEN = process.env.GITHUB_TOKEN || "";
const ADMIN = process.env.ADMIN_PASSWORD || "";
const PORT = Number(process.env.PORT || 3847);
const corsOrigin =
  !process.env.CORS_ORIGIN ||
  process.env.CORS_ORIGIN.trim() === "" ||
  process.env.CORS_ORIGIN.trim() === "*"
    ? true
    : process.env.CORS_ORIGIN.split(",").map((s) => s.trim()).filter(Boolean);

const ghUrl = (p) =>
  `https://api.github.com/repos/${OWNER}/${REPO}${p}`;

async function ghGetContents() {
  const res = await fetch(
    `${ghUrl(`/contents/${encodeURIComponent(FILE_PATH)}`)}?ref=${encodeURIComponent(
      GIT_BRANCH
    )}`,
    {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${TOKEN}`,
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "content-hub-api",
      },
    }
  );

  const text = await res.text();
  if (!res.ok) {
    throw new Error(`GitHub GET ${FILE_PATH}: ${res.status} ${text.slice(0, 200)}`);
  }
  return JSON.parse(text);
}

async function readSubmissionsPayload() {
  const data = await ghGetContents();
  if (!data.content || data.type !== "file") {
    throw new Error(`Unexpected blob for ${FILE_PATH}`);
  }
  const json = Buffer.from(data.content, "base64").toString("utf8");
  /** @type {{ version?: number, entries?: unknown[], categories?: { overseas?: unknown, community?: unknown } }} */
  const parsed = JSON.parse(json || "{}");
  if (!Array.isArray(parsed.entries)) parsed.entries = [];
  if (!parsed.categories || typeof parsed.categories !== "object") {
    parsed.categories = { overseas: null, community: null };
  }
  return { blobSha: /** @type {string} */ (data.sha), body: parsed };
}

async function writeSubmissionsPayload(blobSha, body, message) {
  const content = Buffer.from(JSON.stringify(body, null, 2), "utf8").toString(
    "base64"
  );

  const res = await fetch(ghUrl(`/contents/${encodeURIComponent(FILE_PATH)}`), {
    method: "PUT",
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${TOKEN}`,
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
      "User-Agent": "content-hub-api",
    },
    body: JSON.stringify({
      message,
      content,
      branch: GIT_BRANCH,
      sha: blobSha,
    }),
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(`GitHub PUT ${FILE_PATH}: ${res.status} ${text.slice(0, 200)}`);
  }
  return JSON.parse(text);
}

function checkAdmin(password) {
  if (!ADMIN) return false;
  if (!password || typeof password !== "string") return false;
  const a = Buffer.from(ADMIN, "utf8");
  const b = Buffer.from(password, "utf8");
  if (a.length !== b.length) return false;
  try {
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

function validUrl(url) {
  try {
    const u = new URL(url);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

function requireTokenOr503(res) {
  if (!OWNER || !REPO || !TOKEN) {
    res
      .status(503)
      .json({
        ok: false,
        error:
          "서버 설정 없음(GITHUB_OWNER, GITHUB_REPO, GITHUB_TOKEN). .env 참고.",
      });
    return false;
  }
  return true;
}

const app = express();
app.use(
  cors({
    origin: corsOrigin,
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "X-Admin-Password"],
    maxAge: 86400,
  })
);
app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    hasGithub: !!(OWNER && REPO && TOKEN),
    mutationsNeedPassword: !!ADMIN,
    file: FILE_PATH,
  });
});

app.post("/api/register", async (req, res) => {
  if (!requireTokenOr503(res)) return;

  /** @type {{ space?: string, categoryId?: string, title?: string, desc?: string, url?: string, bodyMd?: string }} */
  const b = req.body || {};
  const title = typeof b.title === "string" ? b.title.trim() : "";
  const desc = typeof b.desc === "string" ? b.desc.trim() : "";
  const url = typeof b.url === "string" ? b.url.trim() : "";
  const bodyMd = typeof b.bodyMd === "string" ? b.bodyMd.trim() : "";
  const space =
    b.space === "community" || b.space === "overseas" ? b.space : "";

  const categoryId =
    typeof b.categoryId === "string" && b.categoryId.trim()
      ? b.categoryId.trim()
      : "";

  if (!space || !title || !categoryId) {
    res.status(400).json({
      ok: false,
      error: "필수: space, categoryId, title",
    });
    return;
  }

  if (space === "overseas") {
    if (!validUrl(url)) {
      res.status(400).json({
        ok: false,
        error: "해외 링크 탭은 https/http URL 이 필요합니다.",
      });
      return;
    }
  } else {
    if (!bodyMd && !validUrl(url)) {
      res.status(400).json({
        ok: false,
        error:
          "게시글 초안: 마크다운 본문(bodyMd) 또는 참고 URL 중 하나는 필요합니다.",
      });
      return;
    }
  }

  try {
    const { blobSha, body } = await readSubmissionsPayload();

    /** @typedef {{ id: string, space: string, categoryId: string, title: string, desc?: string, url: string, bodyMd?: string, createdAt?: string }} Entry */
    /** @type {Entry} */
    const entry = {
      id: crypto.randomUUID(),
      space,
      categoryId,
      title,
      desc,
      url: space === "overseas" ? url : url && validUrl(url) ? url : "",
      createdAt: new Date().toISOString(),
    };
    if (space === "community" && bodyMd) entry.bodyMd = bodyMd;

    body.version = typeof body.version === "number" ? body.version : 1;
    body.entries = Array.isArray(body.entries) ? body.entries : [];
    body.entries.push(entry);

    await writeSubmissionsPayload(
      blobSha,
      body,
      `hub: register · ${space} · ${title.slice(0, 42)}`
    );

    res.json({ ok: true, entry });
  } catch (e) {
    res.status(500).json({
      ok: false,
      error: /** @type {Error} */ (e).message,
    });
  }
});

app.post("/api/edit", async (req, res) => {
  if (!requireTokenOr503(res)) return;
  if (!ADMIN) {
    res.status(503).json({
      ok: false,
      error:
        "수정 기능 비활성: 서버 .env 에 ADMIN_PASSWORD 를 설정하세요.",
    });
    return;
  }
  const pw =
    typeof req.headers["x-admin-password"] === "string"
      ? req.headers["x-admin-password"]
      : "";
  if (!checkAdmin(pw)) {
    res.status(401).json({ ok: false, error: "관리 비밀번호 필요" });
    return;
  }
  /** @type {{ id?: string, title?: string, desc?: string, url?: string, categoryId?: string, bodyMd?: string }} */
  const b = req.body || {};
  const id = typeof b.id === "string" ? b.id.trim() : "";
  if (!id) {
    res.status(400).json({
      ok: false,
      error: "id 필요",
    });
    return;
  }
  try {
    const { blobSha, body } = await readSubmissionsPayload();
    const entries = Array.isArray(body.entries) ? body.entries : [];
    const idx = entries.findIndex((e) => e && typeof e.id === "string" && e.id === id);

    if (idx < 0) {
      res.status(404).json({ ok: false, error: "항목 없음" });
      return;
    }

    /** @type {Record<string, unknown>} */
    const cur = /** @type {Record<string, unknown>} */ (entries[idx]);
    const curSpace = cur.space === "community" ? "community" : "overseas";

    const title =
      typeof b.title === "string" && b.title.trim()
        ? b.title.trim()
        : String(cur.title || "");
    const desc =
      typeof b.desc === "string" ? b.desc.trim() : String(cur.desc ?? "");
    const url =
      typeof b.url === "string" ? b.url.trim() : String(cur.url || "");
    const bodyMd =
      typeof b.bodyMd === "string" ? b.bodyMd.trim() : String(cur.bodyMd ?? "");

    if (!title) {
      res.status(400).json({ ok: false, error: "title 필요" });
      return;
    }

    /** @type {Record<string, unknown>} */
    const next = {
      ...cur,
      title,
      desc,
      updatedAt: new Date().toISOString(),
    };
    if (typeof b.categoryId === "string" && b.categoryId.trim()) {
      next.categoryId = b.categoryId.trim();
    }

    if (curSpace === "overseas") {
      const newUrl = validUrl(url) ? url : String(cur.url || "");
      next.url = newUrl;
      if (!validUrl(String(next.url))) {
        res.status(400).json({ ok: false, error: "유효한 URL 필요" });
        return;
      }
    } else {
      const newUrl = validUrl(url)
        ? url
        : url === ""
          ? ""
          : String(cur.url || "");
      next.url = newUrl;
      if (bodyMd) next.bodyMd = bodyMd;
      else delete next.bodyMd;
      const hasMd = !!(next.bodyMd && String(next.bodyMd).trim());
      const hasU = validUrl(String(next.url || ""));
      if (!hasMd && !hasU) {
        res.status(400).json({
          ok: false,
          error: "본문 또는 참고 URL 중 하나는 있어야 합니다.",
        });
        return;
      }
    }

    entries[idx] = next;
    body.entries = entries;

    await writeSubmissionsPayload(blobSha, body, `hub: edit · ${id}`);

    res.json({ ok: true, entry: entries[idx] });
  } catch (e) {
    res.status(500).json({
      ok: false,
      error: /** @type {Error} */ (e).message,
    });
  }
});

app.post("/api/save-categories", async (req, res) => {
  if (!requireTokenOr503(res)) return;
  if (!ADMIN) {
    res.status(503).json({
      ok: false,
      error:
        "카테고리 저장 비활성: 서버 .env 에 ADMIN_PASSWORD 를 설정하세요.",
    });
    return;
  }
  const pw =
    typeof req.headers["x-admin-password"] === "string"
      ? req.headers["x-admin-password"]
      : "";
  if (!checkAdmin(pw)) {
    res.status(401).json({ ok: false, error: "관리 비밀번호 필요" });
    return;
  }
  /** @type {{ space?: string, categories?: unknown[] }} */
  const b = req.body || {};
  const space =
    b.space === "community"
      ? "community"
      : b.space === "overseas"
        ? "overseas"
        : "";
  const categories = b.categories;
  if (!space || !Array.isArray(categories)) {
    res.status(400).json({
      ok: false,
      error: "필수: space(overseas|community), categories(배열)",
    });
    return;
  }

  /** @type {{ id: string, emoji: string, title: string, subtitle: string }[]} */
  const cleaned = [];
  for (const c of categories) {
    if (!c || typeof c !== "object") continue;
    const raw = /** @type {Record<string, unknown>} */ (c);
    const id = typeof raw.id === "string" ? raw.id.trim() : "";
    const title = typeof raw.title === "string" ? raw.title.trim() : "";
    if (!id || !title) continue;
    cleaned.push({
      id,
      emoji:
        typeof raw.emoji === "string" && raw.emoji.trim()
          ? raw.emoji.trim()
          : "📌",
      title,
      subtitle:
        typeof raw.subtitle === "string" ? raw.subtitle : " ",
    });
  }

  try {
    const { blobSha, body } = await readSubmissionsPayload();
    body.categories = body.categories || { overseas: null, community: null };
    body.categories[space] = cleaned;
    await writeSubmissionsPayload(blobSha, body, `hub: categories · ${space}`);
    res.json({ ok: true, categories: cleaned });
  } catch (e) {
    res.status(500).json({
      ok: false,
      error: /** @type {Error} */ (e).message,
    });
  }
});

app.post("/api/delete", async (req, res) => {
  if (!requireTokenOr503(res)) return;
  if (!ADMIN) {
    res.status(503).json({
      ok: false,
      error:
        "삭제 기능 비활성: 서버 .env 에 ADMIN_PASSWORD 를 설정하세요.",
    });
    return;
  }

  const pw =
    typeof req.headers["x-admin-password"] === "string"
      ? req.headers["x-admin-password"]
      : "";
  if (!checkAdmin(pw)) {
    res.status(401).json({ ok: false, error: "관리 비밀번호 필요" });
    return;
  }

  /** @type {{ id?: string }} */
  const b = req.body || {};
  const id = typeof b.id === "string" ? b.id.trim() : "";

  if (!id) {
    res.status(400).json({ ok: false, error: "id 필요" });
    return;
  }

  try {
    const { blobSha, body } = await readSubmissionsPayload();
    const entries = Array.isArray(body.entries) ? body.entries : [];
    const next = entries.filter((e) => !(e && e.id === id));
    if (next.length === entries.length) {
      res.status(404).json({ ok: false, error: "항목 없음" });
      return;
    }
    body.entries = next;

    await writeSubmissionsPayload(blobSha, body, `hub: delete · ${id}`);

    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({
      ok: false,
      error: /** @type {Error} */ (e).message,
    });
  }
});

app.listen(PORT, () => {
  console.log(
    `[content-hub-api] listening on http://localhost:${PORT} · file ${OWNER}/${REPO}:${FILE_PATH}`
  );
});
