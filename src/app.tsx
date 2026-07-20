import React, { useState, useEffect, useCallback } from "react";
import { Box, Text, useInput, useApp } from "ink";
import { usePRs } from "./hooks/use-prs";
import { SubscriptionManager } from "./lib/subscriptions";
import { Header } from "./components/header";
import { PRList } from "./components/pr-list";
import { DetailPanel } from "./components/detail-panel";
import { Footer } from "./components/footer";
import type { PullRequest } from "./types";

const POLL_INTERVAL = 5000;

const subs = new SubscriptionManager();

interface AppProps {
  repoPath: string;
}

export default function App({ repoPath }: AppProps) {
  const { exit } = useApp();
  const [searchTerm, setSearchTerm] = useState<string>();
  const { prs, error, readyCount, refresh } = usePRs(
    POLL_INTERVAL,
    repoPath,
    subs,
    searchTerm,
  );
  const [cursor, setCursor] = useState(0);
  const [detailPr, setDetailPr] = useState<PullRequest | null>(null);

  const [searchMode, setSearchMode] = useState(false);
  const [searchBuffer, setSearchBuffer] = useState("");
  const [subVersion, setSubVersion] = useState(0);

  useEffect(() => {
    if (cursor >= prs.length && prs.length > 0) {
      setCursor(prs.length - 1);
    }
  }, [prs.length, cursor]);

  const toggleSub = useCallback((num: number) => {
    subs.toggle(num);
    setSubVersion((v) => v + 1);
  }, []);

  useInput(
    (_input, key) => {
      if (key.upArrow && cursor > 0) {
        setCursor((c) => c - 1);
      }
      if (key.downArrow && cursor < prs.length - 1) {
        setCursor((c) => c + 1);
      }
      if (key.return && prs[cursor]) {
        setDetailPr((prev) =>
          prev?.number === prs[cursor]!.number ? null : prs[cursor]!,
        );
      }
      if (key.escape) {
        setDetailPr(null);
      }
      if (_input === "q") {
        exit();
      }
      if (_input === "r") {
        refresh();
      }
      if (_input === "/") {
        setSearchMode(true);
        setSearchBuffer("");
      }
      if (_input === "s" && prs[cursor]) {
        toggleSub(prs[cursor]!.number);
      }
    },
    { isActive: !searchMode },
  );

  useInput(
    (input, key) => {
      if (key.escape) {
        setSearchMode(false);
        setSearchBuffer("");
        setSearchTerm(undefined);
      } else if (key.return) {
        setSearchTerm(searchBuffer || undefined);
        setSearchMode(false);
      } else if (key.backspace) {
        setSearchBuffer((q) => q.slice(0, -1));
      } else if (input.length === 1 && !key.ctrl && !key.meta) {
        setSearchBuffer((q) => q + input);
      }
    },
    { isActive: searchMode },
  );

  return (
    <Box flexDirection="column" width="100%">
      <Header
        repoPath={repoPath}
        prCount={prs.length}
        readyCount={readyCount}
        pollInterval={POLL_INTERVAL}
        searchTerm={searchTerm}
        subCount={subs.count}
      />

      <Box
        borderStyle="round"
        borderColor="gray"
        flexDirection="column"
        paddingX={1}
        marginX={0}
      >
        {searchMode && (
          <Box marginBottom={1}>
            <Text bold color="cyan">
              /{" "}
            </Text>
            <Text>{searchBuffer}</Text>
            <Text>│</Text>
          </Box>
        )}

        <PRList
          prs={prs}
          cursor={cursor}
          error={error}
          searchMode={!!searchTerm}
          subs={subs}
          subVersion={subVersion}
        />

        {detailPr && (
          <DetailPanel pr={detailPr} subs={subs} subVersion={subVersion} />
        )}
      </Box>

      {detailPr && (
        <Box paddingX={2} paddingY={0}>
          <Text dimColor>ESC close · Enter toggle · s subscribe</Text>
        </Box>
      )}

      <Footer searchMode={searchMode} />
    </Box>
  );
}
