import React from "react";
import { Box, Text } from "ink";
import { PRRow } from "./pr-row";
import type { PullRequest } from "../types";

interface PRListProps {
  prs: PullRequest[];
  cursor: number;
  error: string | null;
  searchMode: boolean;
}

export function PRList({ prs, cursor, error, searchMode }: PRListProps) {
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
        <Box width={3}>
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
          showAuthor={searchMode}
        />
      ))}
    </Box>
  );
}
