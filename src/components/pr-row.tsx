import React from "react";
import { Box, Text } from "ink";
import type { PullRequest, StatusCheck } from "../types";

interface PRRowProps {
  pr: PullRequest;
  isSelected: boolean;
  showAuthor: boolean;
}

function mergeableBadge(mergeable: string): { label: string; color: string } {
  switch (mergeable) {
    case "MERGEABLE":
      return { label: "✔", color: "green" };
    case "CONFLICTING":
      return { label: "✘", color: "red" };
    case "UNKNOWN":
      return { label: "?", color: "yellow" };
    default:
      return { label: "?", color: "yellow" };
  }
}

function checkColor(check: StatusCheck): string {
  if (check.status !== "COMPLETED") return "yellow";
  const conclusion = check.conclusion ?? check.state ?? null;
  switch (conclusion) {
    case "SUCCESS":
      return "green";
    case "FAILURE":
    case "CANCELLED":
    case "TIMED_OUT":
    case "ACTION_REQUIRED":
      return "red";
    case "NEUTRAL":
    case "SKIPPED":
      return "blue";
    default:
      return "yellow";
  }
}

function checkSymbol(check: StatusCheck): string {
  if (check.status !== "COMPLETED") return "○";
  const conclusion = check.conclusion ?? check.state ?? null;
  switch (conclusion) {
    case "SUCCESS":
      return "●";
    case "FAILURE":
    case "CANCELLED":
    case "TIMED_OUT":
    case "ACTION_REQUIRED":
      return "●";
    case "NEUTRAL":
    case "SKIPPED":
      return "○";
    default:
      return "○";
  }
}

export function PRRow({ pr, isSelected, showAuthor }: PRRowProps) {
  const mergeStatus = mergeableBadge(pr.mergeable);
  const checks = pr.statusCheckRollup ?? [];
  const prefix = isSelected ? "▸" : " ";

  return (
    <Box>
      <Box width={2} marginRight={1}>
        <Text bold={isSelected} color={isSelected ? "cyan" : undefined}>
          {prefix}
        </Text>
      </Box>

      <Box width={6} marginRight={1}>
        <Text bold={isSelected} color={isSelected ? "cyan" : "gray"}>
          #{pr.number}
        </Text>
      </Box>

      <Box flexGrow={1} marginRight={1}>
        <Text bold={isSelected} wrap="truncate-end">
          <Text dimColor={!isSelected}>{pr.title}</Text>
          {showAuthor && pr.author && (
            <Text dimColor>
              {" "}
              @{pr.author.login}
            </Text>
          )}
        </Text>
      </Box>

      <Box width={4} marginRight={1} justifyContent="center">
        <Text color={mergeStatus.color}>{mergeStatus.label}</Text>
      </Box>

      <Box width={checks.length * 2 + 2}>
        {checks.length === 0 ? (
          <Text color="yellow">○</Text>
        ) : (
          checks.slice(0, 4).map((check, i) => (
            <Text key={i} color={checkColor(check)}>
              {checkSymbol(check)}{" "}
            </Text>
          ))
        )}
        {checks.length > 4 && (
          <Text dimColor>+{checks.length - 4}</Text>
        )}
      </Box>
    </Box>
  );
}
