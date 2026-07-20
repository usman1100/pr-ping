import React from "react";
import { Box, Text } from "ink";
import { PRRow } from "./pr-row";
import type { PullRequest } from "../types";
import type { SubscriptionManager } from "../lib/subscriptions";

interface PRListProps {
  prs: PullRequest[];
  cursor: number;
  error: string | null;
  subs: SubscriptionManager;
  subVersion: number;
  loading: boolean;
}

const HEADER_LABELS = ["", "#", "Title", "Merge", "Appr", "CI", "Updated", "Author"];

export function PRList({
  prs,
  cursor,
  error,
  subs,
  subVersion,
  loading,
}: PRListProps) {
  if (error) {
    return (
      <Box paddingY={1} paddingX={1}>
        <Text color="yellow">⚠ {error}</Text>
      </Box>
    );
  }

  if (prs.length === 0) {
    if (loading) {
      return (
        <Box paddingY={1} paddingX={1}>
          <Text dimColor>Fetching PRs…</Text>
        </Box>
      );
    }
    return (
      <Box paddingY={1} paddingX={1}>
        <Text dimColor>No open PRs found.</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      <Box paddingX={1} marginBottom={0}>
        <Box width={4} />
        <Box width={7}>
          <Text dimColor>#</Text>
        </Box>
        <Box flexGrow={1}>
          <Text dimColor>Title</Text>
        </Box>
        <Box width={4}>
          <Text dimColor>Merge</Text>
        </Box>
        <Box width={4}>
          <Text dimColor>Appr</Text>
        </Box>
        <Box width={8}>
          <Text dimColor>CI</Text>
        </Box>
        <Box width={8}>
          <Text dimColor>Updated</Text>
        </Box>
        <Box width={11}>
          <Text dimColor>Author</Text>
        </Box>
      </Box>

      <Box borderStyle="single" borderDimColor marginBottom={1} marginX={0} />

      {prs.map((pr, i) => (
        <PRRow
          key={pr.number}
          pr={pr}
          isSelected={i === cursor}
          isSubscribed={subs.has(pr.number)}
        />
      ))}
    </Box>
  );
}
