import { useState, useEffect, useRef, useCallback } from "react";
import { fetchPRs, RateLimitError } from "../lib/github";
import { StateTracker, computeReady } from "../lib/state";
import { createNotifier } from "../notifier";
import type { SubscriptionManager } from "../lib/subscriptions";
import type { PullRequest, ViewMode } from "../types";

const notifier = createNotifier();

export function usePRs(
  pollInterval: number,
  repoPath: string,
  subs: SubscriptionManager,
  viewMode: ViewMode,
) {
  const [prs, setPRs] = useState<PullRequest[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [readyCount, setReadyCount] = useState(0);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const trackerRef = useRef(new StateTracker());
  const fetchRef = useRef<() => void>(undefined);

  const searchQuery =
    viewMode.type === "search" ? viewMode.query : undefined;
  const viewType = viewMode.type;

  const fetch = useCallback(() => {
    try {
      let search: string | undefined;
      let author: string | undefined;
      if (viewType === "search" && searchQuery) {
        search = searchQuery;
      } else if (viewType === "mine") {
        author = "@me";
      }
      const data = fetchPRs(repoPath, search, author);

      let filtered = data;
      if (viewType === "subscribed") {
        filtered = data.filter((pr) => subs.has(pr.number));
      }

      const newlyReady = trackerRef.current.update(filtered);
      setPRs(filtered);
      setReadyCount(filtered.filter((pr) => computeReady(pr)).length);
      setError(null);
      setLastUpdated(new Date());

      for (const pr of newlyReady) {
        if (subs.has(pr.number)) {
          notifier.notify(
            "PR Ready!",
            `#${pr.number}: ${pr.title}`,
            pr.url,
          );
        }
      }
    } catch (err) {
      if (err instanceof RateLimitError) {
        setError("Rate limit hit");
      } else {
        setError(err instanceof Error ? err.message : String(err));
      }
    }
  }, [repoPath, subs, viewType, searchQuery]);

  fetchRef.current = fetch;

  useEffect(() => {
    fetch();
    const id = setInterval(() => fetchRef.current?.(), pollInterval);
    return () => clearInterval(id);
  }, [fetch, pollInterval]);

  return { prs, error, readyCount, lastUpdated, refresh: fetch };
}
