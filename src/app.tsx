import React, { useState, useEffect } from "react";
import { Box, Text, useInput, useApp } from "ink";
import { usePRs } from "./hooks/use-prs";
import { Header } from "./components/header";
import { PRList } from "./components/pr-list";
import { DetailPanel } from "./components/detail-panel";
import { Footer } from "./components/footer";
import type { PullRequest } from "./types";

const POLL_INTERVAL = 5000;

interface AppProps {
  repoPath: string;
}

export default function App({ repoPath }: AppProps) {
  const { exit } = useApp();
  const { prs, error, readyCount, refresh } = usePRs(POLL_INTERVAL, repoPath);
  const [cursor, setCursor] = useState(0);
  const [detailPr, setDetailPr] = useState<PullRequest | null>(null);

  useEffect(() => {
    if (cursor >= prs.length && prs.length > 0) {
      setCursor(prs.length - 1);
    }
  }, [prs.length, cursor]);

  useInput((_input, key) => {
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
  });

  return (
    <Box flexDirection="column" width="100%">
      <Header
        repoPath={repoPath}
        prCount={prs.length}
        readyCount={readyCount}
        pollInterval={POLL_INTERVAL}
      />

      <Box
        borderStyle="round"
        borderColor="gray"
        flexDirection="column"
        paddingX={1}
        marginX={0}
      >
        <PRList prs={prs} cursor={cursor} error={error} />

        {detailPr && <DetailPanel pr={detailPr} />}
      </Box>

      {detailPr && (
        <Box paddingX={2} paddingY={0}>
          <Text dimColor>Press ESC to close detail · Enter to toggle</Text>
        </Box>
      )}

      <Footer />
    </Box>
  );
}
