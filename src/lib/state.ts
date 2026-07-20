import { logger } from "./logger";
import type { PullRequest, StatusCheck } from "../types";

function getConclusion(check: StatusCheck): string | null {
  return check.conclusion ?? check.state ?? null;
}

function isCheckCompleted(check: StatusCheck): boolean {
  if (check.status === "COMPLETED") return true;
  if (check.conclusion != null) return true;
  if (check.state != null) return true;
  return false;
}

export function hasApproval(pr: PullRequest): boolean {
  if (!pr.reviews || pr.reviews.length === 0) return false;
  return pr.reviews.some((r) => r.state === "APPROVED");
}

export function computeReady(pr: PullRequest): boolean {
  if (!pr.statusCheckRollup || pr.statusCheckRollup.length === 0) return false;
  if (pr.mergeable !== "MERGEABLE") return false;
  if (!hasApproval(pr)) return false;
  return pr.statusCheckRollup.every((check) => {
    const conclusion = getConclusion(check);
    return (
      isCheckCompleted(check) &&
      (conclusion === "SUCCESS" ||
        conclusion === "NEUTRAL" ||
        conclusion === "SKIPPED")
    );
  });
}

export class StateTracker {
  private cache = new Map<number, boolean>();

  update(prs: PullRequest[]): PullRequest[] {
    const current = new Map(prs.map((pr) => [pr.number, pr]));
    const newlyReady: PullRequest[] = [];

    for (const [num, pr] of current) {
      const nowReady = computeReady(pr);
      const wasReady = this.cache.get(num) ?? false;
      if (nowReady && !wasReady) {
        logger.info({ pr: num, title: pr.title }, "PR became ready");
        newlyReady.push(pr);
      }
      if (wasReady && !nowReady) {
        logger.debug({ pr: num }, "PR no longer ready");
      }
      this.cache.set(num, nowReady);
    }

    for (const num of this.cache.keys()) {
      if (!current.has(num)) {
        logger.debug({ pr: num }, "PR removed from state tracker");
        this.cache.delete(num);
      }
    }

    logger.debug(
      { tracked: this.cache.size, newlyReady: newlyReady.length },
      "state tracker update",
    );
    return newlyReady;
  }

  get size(): number {
    return this.cache.size;
  }
}
