import React from "react";
import { Box, Text } from "ink";

interface HeaderProps {
  repoPath: string;
  prCount: number;
  readyCount: number;
  pollInterval: number;
  searchTerm?: string;
  subCount: number;
}

export function Header({
  repoPath,
  prCount,
  readyCount,
  pollInterval,
  searchTerm,
  subCount,
}: HeaderProps) {
  return (
    <Box justifyContent="space-between" paddingX={1} paddingTop={1}>
      <Text bold color="cyan">
        ● gh-pr-monitor{" "}
        <Text dimColor>
          {repoPath.split("/").pop()}
        </Text>
      </Text>
      <Text>
        {searchTerm ? (
          <Text>
            searching{" "}
            <Text bold italic>
              "{searchTerm}"
            </Text>{" "}
            ·{" "}
          </Text>
        ) : null}
        {prCount} PR{prCount !== 1 ? "s" : ""} ·{" "}
        <Text color={readyCount > 0 ? "green" : undefined}>
          {readyCount} ready
        </Text>
        {subCount > 0 && (
          <Text>
            {" "}·{" "}
            <Text color="cyan">
              {subCount} sub{subCount !== 1 ? "s" : ""}
            </Text>
          </Text>
        )}
        {" · polling "}{pollInterval / 1000}s
      </Text>
    </Box>
  );
}
