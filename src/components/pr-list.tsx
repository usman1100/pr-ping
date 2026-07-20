import React from "react";
import { Box, Text } from "ink";
import { PRRow } from "./pr-row";
import type { PullRequest } from "../types";
import type { SubscriptionManager } from "../lib/subscriptions";

interface PRListProps {
  prs: PullRequest[];
  cursor: number;
  error: string | null;
  searchMode: boolean;
  subs: SubscriptionManager;
  subVersion: number;
}

export function PRList({
  prs,
  cursor,
  error,
  searchMode,
  subs,
  subVersion,
}: PRListProps) {
  if (error) {
    return (
      <Box paddingY={1}>
        <Text color="yellow">⚠ {error}</Text>
      </Box>
    );
  }

  if (prs.length === 0) {
    return (
      <Box paddingY={1}>
        <Text dimColor>No open PRs found.</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      <Box borderStyle="single" borderDimColor paddingX={1} marginBottom={1}>
        <Box width={4}>
          <Text dimColor> </Text>
        </Box>
        <Box width={7}>
          <Text dimColor>#</Text>
        </Box>
        <Box flexGrow={1}>
          <Text dimColor>Title</Text>
        </Box>
        <Box width={5}>
          <Text dimColor>Merge</Text>
        </Box>
        <Box>
          <Text dimColor>CI</Text>
        </Box>
      </Box>

      {prs.map((pr, i) => (
        <PRRow
          key={pr.number}
          pr={pr}
          isSelected={i === cursor}
          isSubscribed={subs.has(pr.number)}
          showAuthor={searchMode}
        />
      ))}
    </Box>
  );
}
