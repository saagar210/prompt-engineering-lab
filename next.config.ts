import type { NextConfig } from "next";

const leanDistDir = process.env.NEXT_DIST_DIR?.trim();

const nextConfig: NextConfig = {
  // Allow lean dev mode to redirect transient Next build output.
  distDir:
    leanDistDir && !leanDistDir.startsWith("..") ? leanDistDir : ".next",
};

export default nextConfig;
