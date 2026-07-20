import { useState, useEffect, useRef, useCallback } from "react";
import { fetchPRs, fetchMergedPRNumbers, RateLimitError } from "../lib/github";
import { StateTracker, computeReady } from "../lib/state";
import { createNotifier } from "../notifier";
import { logger } from "../lib/logger";
import type { SubscriptionManager } from "../lib/subscriptions";
import type { PullRequest, ViewMode, RepoConfig } from "../types";

const notifier = createNotifier();

export function usePRs(
  pollInterval: number,
  repoConfig: RepoConfig,
  subs: SubscriptionManager,
  viewMode: ViewMode,
) {
  const [prs, setPRs] = useState<PullRequest[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [readyCount, setReadyCount] = useState(0);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const trackerRef = useRef(new StateTracker());
  const fetchRef = useRef<() => Promise<void>>(undefined);
  const fetchIdRef = useRef(0);

  const searchQuery =
    viewMode.type === "search" ? viewMode.query : undefined;
  const viewType = viewMode.type;

  const fetch = useCallback(async () => {
    const id = ++fetchIdRef.current;
    logger.debug({ viewType, searchQuery }, "poll cycle starting");
    setLoading(true);
    try {
      let search: string | undefined;
      let author: string | undefined;
      if (viewType === "search" && searchQuery) {
        search = searchQuery;
      } else if (viewType === "mine") {
        author = "@me";
      }
      const data = await fetchPRs(repoConfig, search, author);

      if (id !== fetchIdRef.current) return;

      let filtered = data;
      if (viewType === "subscribed") {
        filtered = data.filter((pr) => subs.has(pr.number));
      }

      const newlyReady = trackerRef.current.update(filtered);
      logger.info(
        { total: filtered.length, newlyReady: newlyReady.length, viewType },
        "poll cycle complete",
      );
      setPRs(filtered);
      setReadyCount(filtered.filter((pr) => computeReady(pr)).length);
      setError(null);
      setLastUpdated(new Date());

      for (const pr of newlyReady) {
        if (subs.has(pr.number)) {
          logger.info({ pr: pr.number, title: pr.title }, "notifying — PR ready");
          notifier.notify(
            "PR Ready!",
            `#${pr.number}: ${pr.title}`,
            pr.url,
          );
        }
      }

      // Remove subscriptions for merged PRs
      if (subs.count > 0) {
        try {
          const mergedNumbers = await fetchMergedPRNumbers(repoConfig);
          for (const num of mergedNumbers) {
            if (subs.has(num)) {
              logger.info({ pr: num }, "auto-unsubscribing from merged PR");
              subs.remove(num);
            }
          }
        } catch {
          logger.warn("merge check failed (silent)");
        }
      }
    } catch (err) {
      if (id !== fetchIdRef.current) return;
      if (err instanceof RateLimitError) {
        logger.warn("rate limit in poll cycle");
        setError("Rate limit hit");
      } else {
        logger.error({ err }, "poll cycle error");
        setError(err instanceof Error ? err.message : String(err));
      }
    } finally {
      if (id === fetchIdRef.current) {
        setLoading(false);
      }
    }
  }, [repoConfig, subs, viewType, searchQuery]);

  fetchRef.current = fetch;

  useEffect(() => {
    logger.info({ pollInterval }, "starting poll interval");
    fetch();
    const id = setInterval(() => { fetchRef.current?.(); }, pollInterval);
    return () => {
      logger.info("stopping poll interval");
      clearInterval(id);
    };
  }, [fetch, pollInterval]);

  return { prs, error, readyCount, lastUpdated, loading, refresh: fetch };
}
