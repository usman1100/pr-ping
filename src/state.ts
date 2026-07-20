export interface StatusCheck {
  conclusion: string | null;
  status: string | null;
}

export interface PullRequest {
  number: number;
  title: string;
  mergeable: string;
  statusCheckRollup: StatusCheck[] | null;
  url: string;
}

export function computeReady(pr: PullRequest): boolean {
  if (!pr.statusCheckRollup || pr.statusCheckRollup.length === 0) return false;
  if (pr.mergeable !== "MERGEABLE") return false;
  return pr.statusCheckRollup.every(
    (check) =>
      check.status === "COMPLETED" &&
      (check.conclusion === "SUCCESS" ||
        check.conclusion === "NEUTRAL" ||
        check.conclusion === "SKIPPED"),
  );
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
        newlyReady.push(pr);
      }
      this.cache.set(num, nowReady);
    }

    for (const num of this.cache.keys()) {
      if (!current.has(num)) {
        this.cache.delete(num);
      }
    }

    return newlyReady;
  }

  get size(): number {
    return this.cache.size;
  }
}
