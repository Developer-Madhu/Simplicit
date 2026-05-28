/**
 * ZIP Provider — client-side ZIP extraction using JSZip.
 * Reads a File blob, extracts text files, skips binaries and large dirs.
 * Returns a Map<string, string> (path → content).
 */

// Maximum file size to read (512KB per file to avoid memory issues)
const MAX_FILE_SIZE = 512 * 1024;
// Maximum number of files to process
const MAX_FILES = 2000;

// Directories to skip entirely
const SKIP_DIRS = new Set([
  "node_modules",
  ".git",
  ".next",
  ".nuxt",
  ".svelte-kit",
  ".output",
  "dist",
  "build",
  ".cache",
  ".turbo",
  "__pycache__",
  ".vercel",
  "coverage",
  ".DS_Store",
]);

// Binary file extensions to skip
const BINARY_EXTENSIONS = new Set([
  ".png", ".jpg", ".jpeg", ".gif", ".svg", ".ico", ".webp", ".avif",
  ".woff", ".woff2", ".ttf", ".eot", ".otf",
  ".mp3", ".mp4", ".wav", ".ogg", ".webm",
  ".zip", ".tar", ".gz", ".bz2", ".7z", ".rar",
  ".pdf", ".doc", ".docx", ".xls", ".xlsx",
  ".exe", ".dll", ".so", ".dylib",
  ".lock",
]);

export interface ZipProcessProgress {
  phase: "extracting" | "reading" | "done";
  current: number;
  total: number;
}

export async function processZipFile(
  file: File,
  onProgress?: (progress: ZipProcessProgress) => void
): Promise<Map<string, string>> {
  // Dynamic import of JSZip (already in the project dependencies)
  const JSZip = (await import("jszip")).default;

  onProgress?.({ phase: "extracting", current: 0, total: 0 });

  const zip = await JSZip.loadAsync(file);

  // Collect valid file paths
  const validPaths: string[] = [];
  zip.forEach((relativePath, zipEntry) => {
    if (zipEntry.dir) return;
    if (shouldSkipPath(relativePath)) return;
    if (isBinaryFile(relativePath)) return;
    validPaths.push(relativePath);
  });

  // Trim the common root folder if present
  // (e.g., if ZIP contains "my-project/src/..." → strip "my-project/")
  const commonPrefix = findCommonPrefix(validPaths);

  const filesToProcess = validPaths.slice(0, MAX_FILES);
  const results = new Map<string, string>();
  let processed = 0;

  onProgress?.({
    phase: "reading",
    current: 0,
    total: filesToProcess.length,
  });

  for (const path of filesToProcess) {
    const entry = zip.file(path);
    if (!entry) continue;

    // Check uncompressed size if available
    // @ts-ignore — JSZip types don't expose _data.uncompressedSize consistently
    const size = entry._data?.uncompressedSize || 0;
    if (size > MAX_FILE_SIZE) continue;

    try {
      const content = await entry.async("string");
      // Only store if content is reasonable size
      if (content.length <= MAX_FILE_SIZE) {
        const normalizedPath = commonPrefix
          ? path.slice(commonPrefix.length)
          : path;
        results.set(normalizedPath, content);
      }
    } catch {
      // Skip files that can't be read as text
    }

    processed++;
    if (processed % 50 === 0 || processed === filesToProcess.length) {
      onProgress?.({
        phase: "reading",
        current: processed,
        total: filesToProcess.length,
      });
    }
  }

  onProgress?.({
    phase: "done",
    current: results.size,
    total: results.size,
  });

  return results;
}

// ─── Helpers ────────────────────────────────────────────────────────

function shouldSkipPath(path: string): boolean {
  const parts = path.replace(/\\/g, "/").split("/");
  return parts.some((part) => SKIP_DIRS.has(part));
}

function isBinaryFile(path: string): boolean {
  const ext = "." + (path.split(".").pop()?.toLowerCase() || "");
  return BINARY_EXTENSIONS.has(ext);
}

function findCommonPrefix(paths: string[]): string {
  if (paths.length === 0) return "";

  const parts = paths[0].split("/");
  if (parts.length < 2) return "";

  // Check if all paths share the same first directory
  const firstDir = parts[0] + "/";
  const allShare = paths.every((p) => p.startsWith(firstDir));

  if (allShare) return firstDir;
  return "";
}
