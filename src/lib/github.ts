import { logger } from "./logger";
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
  logger.info("checking gh auth status");
  const result = Bun.spawnSync(["gh", "auth", "status"]);
  if (result.exitCode !== 0) {
    logger.fatal("gh not authenticated");
    console.error("Not authenticated with gh CLI. Run 'gh auth login' first.");
    process.exit(1);
  }
  logger.info("gh auth ok");
}

const LIST_FIELDS = "number,title,state,createdAt,updatedAt,author,mergeable,isDraft,labels,url";

const DETAIL_FIELDS = "body,reviews,reviewRequests,statusCheckRollup,url";

export async function fetchPRs(
  config: RepoConfig,
  search?: string,
  author?: string,
): Promise<PullRequest[]> {
  const subcommand = [
    "pr", "list", "--limit", "100", "--json", LIST_FIELDS,
  ];
  if (search) {
    subcommand.push("--search", search);
  } else if (author) {
    subcommand.push("--author", author);
  }
  const args = ghArgs(config, subcommand);
  logger.debug({ args }, "fetching PRs");
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
      logger.warn({ stderr }, "rate limit hit");
      throw new RateLimitError(stderr);
    }
    logger.error({ exitCode, stderr }, "gh pr list failed");
    throw new Error(`gh pr list failed: ${stderr}`);
  }

  const prs = JSON.parse(stdout) as PullRequest[];
  logger.info({ count: prs.length, author, search }, "PRs fetched");
  return prs;
}

export async function fetchPRDetail(
  config: RepoConfig,
  number: number,
): Promise<Partial<PullRequest>> {
  logger.debug({ pr: number }, "fetching PR detail");
  const args = ghArgs(config, [
    "pr", "view", String(number), "--json", DETAIL_FIELDS,
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
      logger.warn({ stderr }, "rate limit hit fetching PR detail");
      throw new RateLimitError(stderr);
    }
    logger.error({ exitCode, stderr, pr: number }, "gh pr view failed");
    throw new Error(`gh pr view #${number} failed: ${stderr}`);
  }

  const detail = JSON.parse(stdout) as Partial<PullRequest>;
  logger.debug({ pr: number }, "PR detail fetched");
  return detail;
}

export async function fetchMergedPRNumbers(config: RepoConfig): Promise<number[]> {
  logger.debug("fetching merged PR numbers");
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
      logger.warn({ stderr }, "rate limit hit fetching merged PRs");
      throw new RateLimitError(stderr);
    }
    logger.warn({ exitCode, stderr }, "fetching merged PRs failed");
    return [];
  }

  const items = JSON.parse(stdout) as { number: number }[];
  const numbers = items.map((i) => i.number);
  logger.debug({ count: numbers.length }, "merged PRs fetched");
  return numbers;
}
