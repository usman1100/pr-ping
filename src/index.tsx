import React from "react";
import { render } from "ink";
import { existsSync } from "node:fs";
import { logger } from "./lib/logger";
import { checkAuth } from "./lib/github";
import type { RepoConfig } from "./types";
import App from "./app";

function parseGitHubUrl(url: string): string | null {
  const m = url.match(
    /^https?:\/\/github\.com\/([^\/\s]+\/[^\/\s]+?)(?:\/)?(?:\.git)?$/,
  );
  return m ? m[1]!.replace(/\.git$/, "") : null;
}

const arg = process.argv[2];
if (!arg) {
  logger.fatal("no repo argument provided");
  console.error("Usage: pr-ping <repo-path|https://github.com/owner/repo>");
  process.exit(1);
}

let repoConfig: RepoConfig;
if (existsSync(arg)) {
  repoConfig = { type: "local", path: arg };
  logger.info({ path: arg }, "local repo path resolved");
} else {
  const remote = parseGitHubUrl(arg);
  if (remote) {
    repoConfig = { type: "remote", repo: remote };
    logger.info({ repo: remote, input: arg }, "remote repo resolved");
  } else {
    logger.fatal({ input: arg }, "invalid argument — not a path or GitHub URL");
    console.error(`Error: path does not exist — ${arg}`);
    console.error("Tip: For remote repos, use the full URL (e.g., 'https://github.com/vercel/next.js')");
    process.exit(1);
  }
}

checkAuth();

render(<App repoConfig={repoConfig} />);
