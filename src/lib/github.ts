import type { PullRequest, RepoConfig } from "../types";

export class RateLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RateLimitError";
  }
}

function ghArgs(config: RepoConfig, subcommand: string[]): string[] {
  if (config.type === "local") {
    return ["gh", ...subcommand];
  }
  return ["gh", "--repo", config.repo, ...subcommand];
}

function ghSpawnOpts(config: RepoConfig): Record<string, unknown> {
  if (config.type === "local") {
    return { cwd: config.path };
  }
  return {};
}

export function getRepoDisplayName(config: RepoConfig): string {
  if (config.type === "local") {
    return config.path.split("/").filter(Boolean).pop() ?? config.path;
  }
  return config.repo.split("/").pop() ?? config.repo;
}

export function checkAuth(): void {
  const result = Bun.spawnSync(["gh", "auth", "status"]);
  if (result.exitCode !== 0) {
    console.error("Not authenticated with gh CLI. Run 'gh auth login' first.");
    process.exit(1);
  }
}

export async function fetchPRs(
  config: RepoConfig,
  search?: string,
  author?: string,
): Promise<PullRequest[]> {
  const subcommand = [
    "pr",
    "list",
    "--limit",
    "100",
    "--json",
    "number,title,body,state,createdAt,updatedAt,author,mergeable,isDraft,labels,reviews,reviewRequests,statusCheckRollup,url",
  ];
  if (search) {
    subcommand.push("--search", search);
  } else if (author) {
    subcommand.push("--author", author);
  }
  const args = ghArgs(config, subcommand);
  const proc = Bun.spawn(args, ghSpawnOpts(config));
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

export async function fetchMergedPRNumbers(config: RepoConfig): Promise<number[]> {
  const args = ghArgs(config, [
    "pr", "list", "--state", "merged", "--limit", "50",
    "--json", "number",
  ]);
  const proc = Bun.spawn(args, ghSpawnOpts(config));
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
