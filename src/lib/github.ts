import type { PullRequest } from "../types";

export class RateLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RateLimitError";
  }
}

export function checkAuth(): void {
  const result = Bun.spawnSync(["gh", "auth", "status"]);
  if (result.exitCode !== 0) {
    console.error("Not authenticated with gh CLI. Run 'gh auth login' first.");
    process.exit(1);
  }
}

export function fetchPRs(cwd: string, search?: string): PullRequest[] {
  const args = [
    "gh",
    "pr",
    "list",
    "--limit",
    "100",
    "--json",
    "number,title,author,mergeable,isDraft,reviews,statusCheckRollup,url",
  ];
  if (search) {
    args.push("--search", search);
  }
  const result = Bun.spawnSync(args, { cwd });

  if (result.exitCode !== 0) {
    const stderr = result.stderr.toString();
    if (
      stderr.toLowerCase().includes("rate limit") ||
      stderr.toLowerCase().includes("rate_limit")
    ) {
      throw new RateLimitError(stderr);
    }
    throw new Error(`gh pr list failed: ${stderr}`);
  }

  return JSON.parse(result.stdout.toString()) as PullRequest[];
}
