import React, { useState, useEffect, useCallback, useRef } from "react";
import { Box, Text, useInput, useApp, useWindowSize } from "ink";
import { usePRs } from "./hooks/use-prs";
import { SubscriptionManager } from "./lib/subscriptions";
import { TabBar, getViewModeFromKey } from "./components/tab-bar";
import { PRList } from "./components/pr-list";
import { DetailPanel } from "./components/detail-panel";
import { StatusBar } from "./components/status-bar";
import { HelpOverlay } from "./components/help-overlay";
import type { PullRequest, ViewMode } from "./types";

const POLL_INTERVAL = 5000;
const subs = new SubscriptionManager();

interface AppProps {
  repoPath: string;
}

function openURL(url: string) {
  const cmd = process.platform === "darwin" ? "open" : "xdg-open";
  Bun.spawnSync([cmd, url]);
}

function copyURL(url: string) {
  if (process.platform !== "darwin") return;
  Bun.spawnSync({ cmd: ["pbcopy"], stdin: "pipe" } as any);
}

export default function App({ repoPath }: AppProps) {
  const { exit } = useApp();
  const { columns, rows } = useWindowSize();

  const [viewMode, setViewMode] = useState<ViewMode>({ type: "all" });
  const { prs, error, readyCount, lastUpdated, refresh } = usePRs(
    POLL_INTERVAL,
    repoPath,
    subs,
    viewMode,
  );
  const [cursor, setCursor] = useState(0);
  const [detailPr, setDetailPr] = useState<PullRequest | null>(null);
  const [subVersion, setSubVersion] = useState(0);
  const [showHelp, setShowHelp] = useState(false);

  // Search state
  const [searchMode, setSearchMode] = useState(false);
  const [searchBuffer, setSearchBuffer] = useState("");

  // Track previous view mode for restoring after search
  const prevViewModeRef = useRef<ViewMode>({ type: "all" });

  useEffect(() => {
    if (cursor >= prs.length && prs.length > 0) {
      setCursor(prs.length - 1);
    }
  }, [prs.length, cursor]);

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

      // Navigation
      if (key.upArrow && cursor > 0) {
        setCursor((c) => c - 1);
      }
      if (key.downArrow && cursor < prs.length - 1) {
        setCursor((c) => c + 1);
      }
      if ((key.upArrow || key.downArrow) && detailPr) {
        // Re-evaluate detail PR on cursor change
      }

      // Vim keys
      if (input === "k" && cursor > 0) {
        setCursor((c) => c - 1);
      }
      if (input === "j" && cursor < prs.length - 1) {
        setCursor((c) => c + 1);
      }
      if (input === "g" && !key.ctrl) {
        setCursor(0);
      }
      if (input === "G") {
        setCursor(prs.length - 1);
      }

      // Detail toggle
      if (key.return && prs[cursor]) {
        setDetailPr((prev) =>
          prev?.number === prs[cursor]!.number ? null : prs[cursor]!,
        );
      }
      if (key.escape) {
        setDetailPr(null);
      }

      // Tabs
      const tabMode = getViewModeFromKey(input);
      if (tabMode) {
        setViewMode(tabMode);
        setCursor(0);
        setDetailPr(null);
      }

      // Search
      if (input === "/") {
        prevViewModeRef.current = viewMode;
        setSearchMode(true);
        setSearchBuffer("");
      }

      // Subscribe
      if (input === "s" && prs[cursor]) {
        toggleSub(prs[cursor]!.number);
        // If on subscribed tab, re-render will reflect the change
        if (viewMode.type === "subscribed") {
          refresh();
        }
      }

      // Open in browser
      if (input === "o" && prs[cursor]) {
        openURL(prs[cursor]!.url);
      }

      // Copy URL
      if (input === "y" && prs[cursor]) {
        copyURL(prs[cursor]!.url);
      }

      // Refresh
      if (input === "r") {
        refresh();
      }

      // Help
      if (input === "?") {
        setShowHelp(true);
      }

      // Quit
      if (input === "q") {
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
  const detailHeight =
    detailPr ? Math.min(18, Math.floor(contentHeight * 0.45)) : 0;

  return (
    <Box width={columns} height={rows} flexDirection="column">
      <TabBar
        activeTab={viewMode}
        repoPath={repoPath}
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
                prs={prs}
                cursor={cursor}
                error={error}
                subs={subs}
                subVersion={subVersion}
              />
            </Box>
            <Box height={detailHeight} overflowY="hidden">
              <DetailPanel
                pr={detailPr}
                subs={subs}
                subVersion={subVersion}
              />
            </Box>
          </Box>
        ) : (
          <Box flexGrow={1} overflowY="hidden">
            <PRList
              prs={prs}
              cursor={cursor}
              error={error}
              subs={subs}
              subVersion={subVersion}
            />
          </Box>
        )}
      </Box>

      <StatusBar
        viewMode={viewMode}
        prCount={prs.length}
        readyCount={readyCount}
        subCount={subs.count}
        pollInterval={POLL_INTERVAL}
        lastUpdated={lastUpdated}
        error={error}
      />

      {showHelp && <HelpOverlay onClose={() => setShowHelp(false)} />}
    </Box>
  );
}
