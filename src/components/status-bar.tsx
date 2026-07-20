import React from "react";
import { Box, Text, useAnimation } from "ink";
import type { ViewMode } from "../types";

interface StatusBarProps {
  viewMode: ViewMode;
  prCount: number;
  readyCount: number;
  subCount: number;
  currentPage: number;
  totalPages: number;
  pollInterval: number;
  lastUpdated: Date | null;
  error: string | null;
  loading: boolean;
}

const SPINNER = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

function timeSince(date: Date | null): string {
  if (!date) return "";
  const s = Math.floor((Date.now() - date.getTime()) / 1000);
  if (s < 5) return "now";
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  return `${Math.floor(m / 60)}h ago`;
}

export function StatusBar({
  viewMode,
  prCount,
  readyCount,
  subCount,
  currentPage,
  totalPages,
  pollInterval,
  lastUpdated,
  error,
  loading,
}: StatusBarProps) {
  const { frame } = useAnimation({ interval: 80 });
  const spinner = SPINNER[frame % SPINNER.length];
  const indicator = loading ? spinner : "●";
  const dotColor = error ? "red" : loading ? "yellow" : "green";

  const viewLabel =
    viewMode.type === "all"
      ? "All"
      : viewMode.type === "mine"
        ? "Mine"
        : viewMode.type === "subscribed"
          ? "Subscribed"
          : `Search: "${viewMode.query}"`;

  return (
    <Box justifyContent="space-between" paddingX={1} height={1}>
      <Box gap={1}>
        <Text color={dotColor}>{indicator}</Text>
        <Text dimColor>polling {pollInterval / 1000}s</Text>
        <Text dimColor>|</Text>
        <Text color="cyan">{viewLabel}</Text>
      </Box>

      <Box gap={1}>
        <Text>
          {prCount} PR{prCount !== 1 ? "s" : ""}
        </Text>
        <Text color={readyCount > 0 ? "green" : undefined}>
          · {readyCount} ready
        </Text>
        {subCount > 0 && (
          <Text color="cyan">
            · {subCount} sub{subCount !== 1 ? "s" : ""}
          </Text>
        )}
      </Box>

      <Box gap={1}>
        {totalPages > 1 && (
          <Text dimColor>
            {currentPage}/{totalPages}
          </Text>
        )}
        {loading && !error && (
          <Text dimColor>refreshing…</Text>
        )}
        {error ? (
          <Text color="yellow">⚠ {error}</Text>
        ) : (
          <Text dimColor>last: {timeSince(lastUpdated)}</Text>
        )}
      </Box>
    </Box>
  );
}
