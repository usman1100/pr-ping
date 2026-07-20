import React from "react";
import { Box, Text } from "ink";
import type { ViewMode, RepoConfig } from "../types";
import { getRepoDisplayName } from "../lib/github";

interface Tab {
  key: string;
  label: string;
  mode: ViewMode;
}

interface TabBarProps {
  activeTab: ViewMode;
  repoConfig: RepoConfig;
  counts: Record<string, number>;
  searchMode: boolean;
  searchBuffer: string;
}

const TABS: Tab[] = [
  { key: "1", label: "All", mode: { type: "all" } },
  { key: "2", label: "Mine", mode: { type: "mine" } },
  { key: "3", label: "Subscribed", mode: { type: "subscribed" } },
];

function tabLabel(tab: Tab, count: number): string {
  if (tab.key === "1") return `[1]All (${count})`;
  if (tab.key === "2") return `[2]Mine (${count})`;
  return `[3]Sub (${count})`;
}

export function TabBar({
  activeTab,
  repoConfig,
  counts,
  searchMode,
  searchBuffer,
}: TabBarProps) {
  return (
    <Box justifyContent="space-between" paddingX={1} paddingY={0} height={1}>
      <Box gap={2}>
        {TABS.map((tab) => {
          const key = tab.key;
          const count = counts[key] ?? 0;
          const isActive =
            activeTab.type === tab.mode.type &&
            (activeTab.type !== "search" || tab.mode.type !== "search");
          return (
            <Text key={key} bold={isActive} color={isActive ? "cyan" : "gray"}>
              {tabLabel(tab, count)}
            </Text>
          );
        })}
        {searchMode && (
          <Text bold color="cyan">
            [4]Search: / {searchBuffer}│
          </Text>
        )}
      </Box>
      <Text dimColor>{getRepoDisplayName(repoConfig)}</Text>
    </Box>
  );
}

export function getViewModeFromKey(key: string): ViewMode | null {
  switch (key) {
    case "1":
      return { type: "all" };
    case "2":
      return { type: "mine" };
    case "3":
      return { type: "subscribed" };
    default:
      return null;
  }
}
