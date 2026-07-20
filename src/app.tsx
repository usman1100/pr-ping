import React, { useState, useEffect, useCallback, useRef } from "react";
import { Box, Text, useInput, useApp, useWindowSize } from "ink";
import { usePRs } from "./hooks/use-prs";
import { SubscriptionManager } from "./lib/subscriptions";
import { TabBar, getViewModeFromKey } from "./components/tab-bar";
import { PRList } from "./components/pr-list";
import { DetailPanel } from "./components/detail-panel";
import { StatusBar } from "./components/status-bar";
import { HelpOverlay } from "./components/help-overlay";
import type { PullRequest, ViewMode, RepoConfig } from "./types";
import { getRepoDisplayName, fetchPRDetail } from "./lib/github";
import { logger } from "./lib/logger";

const POLL_INTERVAL = 30000;
const PRS_PER_PAGE = 15;
const subs = new SubscriptionManager();

interface AppProps {
  repoConfig: RepoConfig;
}

function openURL(url: string) {
  const cmd = process.platform === "darwin" ? "open" : "xdg-open";
  Bun.spawnSync([cmd, url]);
}

function copyURL(url: string) {
  if (process.platform !== "darwin") return;
  Bun.spawnSync(["pbcopy"], { input: url } as any);
}

export default function App({ repoConfig }: AppProps) {
  const { exit } = useApp();
  const { columns, rows } = useWindowSize();

  const [viewMode, setViewMode] = useState<ViewMode>({ type: "all" });
  const { prs, error, readyCount, lastUpdated, loading, refresh } = usePRs(
    POLL_INTERVAL,
    repoConfig,
    subs,
    viewMode,
  );
  const [cursor, setCursor] = useState(0);
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(prs.length / PRS_PER_PAGE));
  const pagePrs = prs.slice((page - 1) * PRS_PER_PAGE, page * PRS_PER_PAGE);
  const [detailPr, setDetailPr] = useState<PullRequest | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const detailFetchIdRef = useRef(0);
  const [subVersion, setSubVersion] = useState(0);
  const [showHelp, setShowHelp] = useState(false);

  // Search state
  const [searchMode, setSearchMode] = useState(false);
  const [searchBuffer, setSearchBuffer] = useState("");

  // Track previous view mode for restoring after search
  const prevViewModeRef = useRef<ViewMode>({ type: "all" });

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [totalPages, page]);

  useEffect(() => {
    if (cursor >= pagePrs.length && pagePrs.length > 0) {
      setCursor(pagePrs.length - 1);
    }
  }, [pagePrs.length, cursor]);

  const toggleSub = useCallback((num: number) => {
    subs.toggle(num);
    setSubVersion((v) => v + 1);
  }, []);

  // Tab count badges
  const allCount = prs.length;
  const mineCount = prs.filter((p) => p.author?.login).length;
  const subCount = prs.filter((p) => subs.has(p.number)).length;
  const tabCounts: Record<string, number> = {
    "1": allCount,
    "2": mineCount,
    "3": subCount,
  };

  // Navigation input — inactive during search mode or help
  useInput(
    (input, key) => {
      if (showHelp) {
        if (input === "?" || key.escape) {
          setShowHelp(false);
        }
        return;
      }

      // Page navigation
      if ((input === "[" || key.leftArrow) && page > 1) {
        setPage((p) => p - 1);
        setCursor(0);
        setDetailPr(null);
      }
      if ((input === "]" || key.rightArrow) && page < totalPages) {
        setPage((p) => p + 1);
        setCursor(0);
        setDetailPr(null);
      }

      // Navigation
      if (key.upArrow && cursor > 0) {
        setCursor((c) => c - 1);
      }
      if (key.downArrow && cursor < pagePrs.length - 1) {
        setCursor((c) => c + 1);
      }
      if ((key.upArrow || key.downArrow) && detailPr) {
        // Re-evaluate detail PR on cursor change
      }

      // Vim keys
      if (input === "k" && cursor > 0) {
        setCursor((c) => c - 1);
      }
      if (input === "j" && cursor < pagePrs.length - 1) {
        setCursor((c) => c + 1);
      }
      if (input === "g" && !key.ctrl) {
        setCursor(0);
      }
      if (input === "G") {
        setCursor(pagePrs.length - 1);
      }

      // Detail toggle
      if (key.return && pagePrs[cursor]) {
        const pr = pagePrs[cursor]!;
        const isClosing = detailPr?.number === pr.number;
        if (isClosing) {
          setDetailPr(null);
        } else {
          setDetailPr(pr);
          setDetailLoading(true);
          const id = ++detailFetchIdRef.current;
          fetchPRDetail(repoConfig, pr.number).then((detail) => {
            if (id === detailFetchIdRef.current) {
              setDetailPr((prev) =>
                prev?.number === pr.number ? { ...pr, ...detail } : prev,
              );
              setDetailLoading(false);
            }
          }).catch((err) => {
            if (id === detailFetchIdRef.current) {
              logger.error({ pr: pr.number, err }, "failed to fetch PR detail");
              setDetailLoading(false);
            }
          });
        }
      }
      if (key.escape) {
        setDetailPr(null);
      }

      // Tabs
      const tabMode = getViewModeFromKey(input);
      if (tabMode) {
        logger.info({ tab: tabMode.type }, "tab switch");
        setViewMode(tabMode);
        setCursor(0);
        setDetailPr(null);
      }

      // Search
      if (input === "/") {
        logger.info("search mode entered");
        prevViewModeRef.current = viewMode;
        setSearchMode(true);
        setSearchBuffer("");
      }

      // Subscribe
      if (input === "s" && pagePrs[cursor]) {
        const pr = pagePrs[cursor]!;
        toggleSub(pr.number);
        logger.info({ pr: pr.number, subscribed: subs.has(pr.number) }, "subscribe toggle");
        if (viewMode.type === "subscribed") {
          refresh();
        }
      }

      // Open in browser
      if (input === "o" && pagePrs[cursor]) {
        logger.info({ pr: pagePrs[cursor]!.number, url: pagePrs[cursor]!.url }, "opening in browser");
        openURL(pagePrs[cursor]!.url);
      }

      // Copy URL
      if (input === "y" && pagePrs[cursor]) {
        logger.info({ pr: pagePrs[cursor]!.number }, "copying URL");
        copyURL(pagePrs[cursor]!.url);
      }

      // Refresh
      if (input === "r") {
        logger.info("manual refresh triggered");
        refresh();
      }

      // Help
      if (input === "?") {
        logger.info("help overlay toggled");
        setShowHelp(true);
      }

      // Quit
      if (input === "q") {
        logger.info("user quit");
        exit();
      }
    },
    { isActive: !searchMode },
  );

  // Search input — only active during search mode
  useInput(
    (input, key) => {
      if (key.escape) {
        setSearchMode(false);
        setSearchBuffer("");
      } else if (key.return) {
        if (searchBuffer) {
          setViewMode({ type: "search", query: searchBuffer });
          setCursor(0);
          setDetailPr(null);
        }
        setSearchMode(false);
      } else if (key.backspace) {
        setSearchBuffer((q) => q.slice(0, -1));
      } else if (input.length === 1 && !key.ctrl && !key.meta) {
        setSearchBuffer((q) => q + input);
      }
    },
    { isActive: searchMode },
  );

  const contentHeight = rows - 2; // minus tab bar and status bar
  const detailHeight = detailPr
    ? Math.min(18, Math.floor(contentHeight * 0.45))
    : 0;

  return (
    <Box width={columns} height={rows} flexDirection="column">
      <TabBar
        activeTab={viewMode}
        repoConfig={repoConfig}
        counts={tabCounts}
        searchMode={searchMode}
        searchBuffer={searchBuffer}
      />

      <Box
        flexGrow={1}
        flexDirection="column"
        paddingX={0}
        paddingY={0}
        overflowY="hidden"
      >
        {detailPr ? (
          <Box flexDirection="column" flexGrow={1}>
            <Box flexGrow={1} overflowY="hidden">
              <PRList
                prs={pagePrs}
                cursor={cursor}
                error={error}
                subs={subs}
                subVersion={subVersion}
                loading={loading}
              />
            </Box>
            <Box height={detailHeight} overflowY="hidden">
              <DetailPanel
                pr={detailPr}
                subs={subs}
                subVersion={subVersion}
                loading={detailLoading}
              />
            </Box>
          </Box>
        ) : (
          <Box flexGrow={1} overflowY="hidden">
            <PRList
              prs={pagePrs}
              cursor={cursor}
              error={error}
              subs={subs}
              subVersion={subVersion}
              loading={loading}
            />
          </Box>
        )}
      </Box>

      <StatusBar
        viewMode={viewMode}
        prCount={prs.length}
        readyCount={readyCount}
        subCount={subs.count}
        currentPage={page}
        totalPages={totalPages}
        pollInterval={POLL_INTERVAL}
        lastUpdated={lastUpdated}
        error={error}
        loading={loading}
      />

      {showHelp && <HelpOverlay onClose={() => setShowHelp(false)} />}
    </Box>
  );
}
