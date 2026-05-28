import type { IngestionResult } from "../types";

export function calculateComplexity(result: IngestionResult): number {
  const { metadata, dependencies, routes } = result;

  let score = 0;

  // 1. Scale based on file volume (up to 30 points)
  // 10 files = 5 pts, 50 files = 15 pts, 200+ files = 30 pts
  score += Math.min(30, (metadata.totalFiles / 200) * 30);

  // 2. Scale based on page count (up to 25 points)
  // 3 pages = 5 pts, 10 pages = 15 pts, 25+ pages = 25 pts
  score += Math.min(25, (metadata.totalPages / 25) * 25);

  // 3. Scale based on dependency depth (up to 20 points)
  // More dependencies often mean more complex logic or UI
  score += Math.min(20, (dependencies.length / 50) * 20);

  // 4. Boost for dynamic routes (up to 15 points)
  const dynamicRoutes = routes.filter(r => r.isDynamic).length;
  score += Math.min(15, (dynamicRoutes / 5) * 15);

  // 5. Boost for existing backend complexity (up to 10 points)
  // If they already have Supabase, Firebase, or Prisma, it's a more serious project
  if (metadata.existingBackendIntegrations.length > 0) {
    score += 10;
  }

  return Math.round(score);
}

export function inferMissingBackendSystems(result: IngestionResult): string[] {
  const missing: string[] = [];
  const files = result.keyFiles;
  const pkgContent = files.get("package.json") || "";
  const readmeContent = Array.from(files.values()).find(c => c.toLowerCase().includes("#") && c.length > 100) || "";
  
  const allContent = Array.from(result.keyFiles.values()).join(" ").toLowerCase();

  // 1. Auth check
  const hasAuthLib = ["next-auth", "@clerk/nextjs", "lucia", "@supabase/auth-helpers-nextjs", "firebase-auth"].some(lib => pkgContent.includes(lib));
  if (!hasAuthLib && (allContent.includes("login") || allContent.includes("signup") || allContent.includes("auth"))) {
    missing.push("authentication");
  }

  // 2. Database check
  const hasDBLib = ["prisma", "drizzle", "mongoose", "@supabase/supabase-js", "firebase-admin", "pg"].some(lib => pkgContent.includes(lib));
  if (!hasDBLib && (allContent.includes("database") || allContent.includes("models") || result.metadata.totalFiles > 20)) {
    missing.push("database persistence");
  }

  // 3. Payments check
  if (allContent.includes("payment") || allContent.includes("billing") || allContent.includes("stripe") || allContent.includes("checkout")) {
    const hasStripe = pkgContent.includes("stripe");
    if (!hasStripe) missing.push("payments infrastructure");
  }

  // 4. File uploads
  if (allContent.includes("upload") || allContent.includes("s3") || allContent.includes("cloudinary") || allContent.includes("storage")) {
    const hasUploadLib = ["aws-sdk", "cloudinary", "multer", "@uploadthing/react"].some(lib => pkgContent.includes(lib));
    if (!hasUploadLib) missing.push("file storage");
  }

  // 5. Realtime
  if (allContent.includes("realtime") || allContent.includes("socket") || allContent.includes("pusher") || allContent.includes("websockets")) {
    const hasRealtime = ["socket.io", "pusher", "ably"].some(lib => pkgContent.includes(lib));
    if (!hasRealtime) missing.push("realtime updates");
  }

  return missing;
}
