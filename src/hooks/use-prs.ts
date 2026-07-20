import { useState, useEffect, useRef, useCallback } from "react";
import { fetchMyPRs, RateLimitError } from "../lib/github";
import { StateTracker, computeReady } from "../lib/state";
import { createNotifier } from "../notifier";
import type { PullRequest } from "../types";

const notifier = createNotifier();

export function usePRs(pollInterval: number) {
  const [prs, setPRs] = useState<PullRequest[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [readyCount, setReadyCount] = useState(0);
  const trackerRef = useRef(new StateTracker());
  const fetchRef = useRef<() => void>(undefined);

  const fetch = useCallback(() => {
    try {
      const data = fetchMyPRs();
      const newlyReady = trackerRef.current.update(data);
      setPRs(data);
      setReadyCount(data.filter((pr) => computeReady(pr)).length);
      setError(null);

      for (const pr of newlyReady) {
        notifier.notify("PR Ready!", `#${pr.number}: ${pr.title}`, pr.url);
      }
    } catch (err) {
      if (err instanceof RateLimitError) {
        setError("Rate limit hit. Backing off...");
      } else {
        setError(err instanceof Error ? err.message : String(err));
      }
    }
  }, []);

  fetchRef.current = fetch;

  useEffect(() => {
    fetch();
    const id = setInterval(() => fetchRef.current?.(), pollInterval);
    return () => clearInterval(id);
  }, [pollInterval]);

  return { prs, error, readyCount, refresh: fetch };
}
