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

export async function fetchPRs(
  cwd: string,
  search?: string,
  author?: string,
): Promise<PullRequest[]> {
  const args = [
    "gh",
    "pr",
    "list",
    "--limit",
    "100",
    "--json",
    "number,title,body,state,createdAt,updatedAt,author,mergeable,isDraft,labels,reviews,reviewRequests,statusCheckRollup,url",
  ];
  if (search) {
    args.push("--search", search);
  } else if (author) {
    args.push("--author", author);
  }
  const proc = Bun.spawn(args, { cwd });
  const [stdout, stderr] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
  ]);
  const exitCode = await proc.exited;

  if (exitCode !== 0) {
    if (
      stderr.toLowerCase().includes("rate limit") ||
      stderr.toLowerCase().includes("rate_limit")
    ) {
      throw new RateLimitError(stderr);
    }
    throw new Error(`gh pr list failed: ${stderr}`);
  }

  return JSON.parse(stdout) as PullRequest[];
}

export async function fetchMergedPRNumbers(cwd: string): Promise<number[]> {
  const proc = Bun.spawn([
    "gh", "pr", "list", "--state", "merged", "--limit", "50",
    "--json", "number",
  ], { cwd });
  const [stdout, stderr] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
  ]);
  const exitCode = await proc.exited;

  if (exitCode !== 0) {
    if (
      stderr.toLowerCase().includes("rate limit") ||
      stderr.toLowerCase().includes("rate_limit")
    ) {
      throw new RateLimitError(stderr);
    }
    return [];
  }

  const items = JSON.parse(stdout) as { number: number }[];
  return items.map((i) => i.number);
}
