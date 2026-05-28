/**
 * GitHub Provider — fetches a repository's file tree and key files
 * using the GitHub REST API. Uses the user's stored PAT.
 */

// Key files we always want to download content for
const KEY_FILE_PATTERNS = [
  "package.json",
  "tsconfig.json",
  "next.config.js",
  "next.config.mjs",
  "next.config.ts",
  "nuxt.config.ts",
  "nuxt.config.js",
  "svelte.config.js",
  "svelte.config.ts",
  "vite.config.ts",
  "vite.config.js",
  "tailwind.config.js",
  "tailwind.config.ts",
  "tailwind.config.mjs",
  ".env.example",
  ".env.template",
  "README.md",
  "readme.md",
];

// File extensions that are worth downloading content for
const ANALYZABLE_EXTENSIONS = new Set([
  ".ts", ".tsx", ".js", ".jsx", ".vue", ".svelte",
  ".json", ".yaml", ".yml", ".toml",
  ".md", ".mdx",
  ".css", ".scss",
  ".env", ".env.example", ".env.local", ".env.template",
]);

// Max file size to fetch content for (100KB)
const MAX_CONTENT_SIZE = 100 * 1024;

// Max number of files to fetch content for (to avoid rate limiting)
const MAX_CONTENT_FETCHES = 50;

// Directories to skip
const SKIP_DIRS = new Set([
  "node_modules", ".git", ".next", ".nuxt", ".svelte-kit",
  ".output", "dist", "build", ".cache", ".turbo",
  "coverage", ".vercel", "__pycache__",
]);

export interface GitHubProgress {
  phase: "fetching-tree" | "downloading-files" | "done" | "error";
  current: number;
  total: number;
  message?: string;
}

/**
 * Parse a GitHub URL into owner and repo.
 * Supports: github.com/user/repo, https://github.com/user/repo, etc.
 */
export function parseGitHubUrl(
  url: string
): { owner: string; repo: string } | null {
  const trimmed = url.trim();

  // Try URL parsing
  try {
    const parsed = new URL(
      trimmed.startsWith("http") ? trimmed : `https://${trimmed}`
    );
    if (!parsed.hostname.includes("github.com")) return null;

    const parts = parsed.pathname
      .split("/")
      .filter(Boolean)
      .map((p) => p.replace(/\.git$/, ""));
    if (parts.length < 2) return null;

    return { owner: parts[0], repo: parts[1] };
  } catch {}

  // Try simple "user/repo" format
  const simpleMatch = trimmed.match(
    /^([a-zA-Z0-9_-]+)\/([a-zA-Z0-9._-]+)$/
  );
  if (simpleMatch) {
    return {
      owner: simpleMatch[1],
      repo: simpleMatch[2].replace(/\.git$/, ""),
    };
  }

  return null;
}

/**
 * Validate that the repo is accessible (either public or via PAT).
 */
export async function validateRepoAccess(
  owner: string,
  repo: string,
  pat?: string | null
): Promise<{ valid: boolean; defaultBranch: string; isPrivate: boolean; error?: string }> {
  try {
    const headers: Record<string, string> = {
      Accept: "application/vnd.github.v3+json",
    };
    if (pat) {
      headers.Authorization = `Bearer ${pat}`;
    }

    const res = await fetch(
      `https://api.github.com/repos/${owner}/${repo}`,
      { headers }
    );

    if (!res.ok) {
      if (res.status === 404) {
        // If we have a PAT and it still fails, it's either missing or truly private and PAT lacks scope
        if (pat) {
          return {
            valid: false,
            defaultBranch: "main",
            isPrivate: true,
            error: "Repository not found or access denied. Check your PAT scopes.",
          };
        }
        // If no PAT, could be private
        return {
          valid: false,
          defaultBranch: "main",
          isPrivate: true,
          error: "Repository not found or private.",
        };
      }
      if (res.status === 401 || res.status === 403) {
        // Rate limited or bad PAT
        const isRateLimit = res.headers.get("x-ratelimit-remaining") === "0";
        return {
          valid: false,
          defaultBranch: "main",
          isPrivate: !isRateLimit,
          error: isRateLimit 
            ? "GitHub API rate limit exceeded. Please try again later or provide a PAT."
            : "Authentication failed. Check your Personal Access Token.",
        };
      }
      return {
        valid: false,
        defaultBranch: "main",
        isPrivate: false,
        error: `GitHub API returned status ${res.status}`,
      };
    }

    const data = await res.json();
    return {
      valid: true,
      defaultBranch: data.default_branch || "main",
      isPrivate: data.private || false,
    };
  } catch (err: any) {
    return {
      valid: false,
      defaultBranch: "main",
      isPrivate: false,
      error: err.message || "Failed to connect to GitHub",
    };
  }
}

/**
 * Fetch a repository's file tree and selectively download key files.
 */
export async function fetchGitHubRepo(
  owner: string,
  repo: string,
  pat?: string | null,
  onProgress?: (progress: GitHubProgress) => void
): Promise<Map<string, string>> {
  onProgress?.({
    phase: "fetching-tree",
    current: 0,
    total: 0,
    message: "Validating repository access...",
  });

  // 1. Validate repo and get default branch
  const validation = await validateRepoAccess(owner, repo, pat);
  if (!validation.valid) {
    // If it's private and we don't have a PAT, or if the PAT failed, we throw specialized error
    const error = new Error(validation.error || "Cannot access repository");
    (error as any).isPrivate = validation.isPrivate;
    throw error;
  }

  onProgress?.({
    phase: "fetching-tree",
    current: 0,
    total: 0,
    message: "Fetching repository tree...",
  });

  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
  };
  if (pat) {
    headers.Authorization = `Bearer ${pat}`;
  }

  // 2. Fetch recursive tree
  const treeRes = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/git/trees/${validation.defaultBranch}?recursive=1`,
    { headers }
  );

  if (!treeRes.ok) {
    throw new Error(`Failed to fetch repository tree: ${treeRes.status}`);
  }

  const treeData = await treeRes.json();
  if (treeData.truncated) {
    console.warn("GitHub tree was truncated — repo has many files. Only partial analysis possible.");
  }

  // 3. Filter tree entries to valid files
  const fileEntries: Array<{ path: string; size: number }> = (
    treeData.tree || []
  )
    .filter(
      (entry: any) =>
        entry.type === "blob" && !shouldSkipPath(entry.path)
    )
    .map((entry: any) => ({
      path: entry.path,
      size: entry.size || 0,
    }));

  // 4. Determine which files to download content for
  const filesToDownload = prioritizeFiles(fileEntries);

  onProgress?.({
    phase: "downloading-files",
    current: 0,
    total: filesToDownload.length,
    message: `Downloading ${filesToDownload.length} key files...`,
  });

  // 5. Download content for key files
  const results = new Map<string, string>();

  // Add all paths to file tree (even without content)
  for (const entry of fileEntries) {
    results.set(entry.path, ""); // empty string = in tree but not downloaded
  }

  // Download key files in batches
  let downloaded = 0;
  const batchSize = 5;

  for (let i = 0; i < filesToDownload.length; i += batchSize) {
    const batch = filesToDownload.slice(i, i + batchSize);

    const contents = await Promise.all(
      batch.map(async (filePath) => {
        try {
          const res = await fetch(
            `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}?ref=${validation.defaultBranch}`,
            { headers }
          );

          if (!res.ok) return { path: filePath, content: null };

          const data = await res.json();
          if (data.encoding === "base64" && data.content) {
            const decoded = atob(data.content.replace(/\n/g, ""));
            return { path: filePath, content: decoded };
          }
          return { path: filePath, content: null };
        } catch {
          return { path: filePath, content: null };
        }
      })
    );

    for (const { path, content } of contents) {
      if (content) {
        results.set(path, content);
      }
    }

    downloaded += batch.length;
    onProgress?.({
      phase: "downloading-files",
      current: downloaded,
      total: filesToDownload.length,
      message: `Downloaded ${downloaded}/${filesToDownload.length} files`,
    });
  }

  onProgress?.({
    phase: "done",
    current: results.size,
    total: results.size,
    message: "Repository imported successfully",
  });

  return results;
}

// ─── Helpers ────────────────────────────────────────────────────────

function shouldSkipPath(path: string): boolean {
  const parts = path.split("/");
  return parts.some((part) => SKIP_DIRS.has(part));
}

function prioritizeFiles(
  entries: Array<{ path: string; size: number }>
): string[] {
  const priority: string[] = [];
  const secondary: string[] = [];

  for (const entry of entries) {
    if (entry.size > MAX_CONTENT_SIZE) continue;

    const filename = entry.path.split("/").pop() || "";
    const ext = "." + (filename.split(".").pop() || "");

    // Always download key config files
    if (KEY_FILE_PATTERNS.some((pat) => filename === pat || filename.startsWith(pat))) {
      priority.push(entry.path);
      continue;
    }

    // Download analyzable source files (up to the limit)
    if (ANALYZABLE_EXTENSIONS.has(ext)) {
      secondary.push(entry.path);
    }
  }

  // Prioritize: key files first, then source files up to limit
  const combined = [...priority, ...secondary];
  return combined.slice(0, MAX_CONTENT_FETCHES);
}
