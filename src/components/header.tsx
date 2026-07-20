import React from "react";
import { Box, Text } from "ink";

interface HeaderProps {
  repoPath: string;
  prCount: number;
  readyCount: number;
  pollInterval: number;
}

export function Header({
  repoPath,
  prCount,
  readyCount,
  pollInterval,
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
        {prCount} PR{prCount !== 1 ? "s" : ""} ·{" "}
        <Text color={readyCount > 0 ? "green" : undefined}>
          {readyCount} ready
        </Text>{" "}
        · polling {pollInterval / 1000}s
      </Text>
    </Box>
  );
}
