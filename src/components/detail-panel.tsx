import React from "react";
import { Box, Text } from "ink";
import type { PullRequest, StatusCheck } from "../types";

interface DetailPanelProps {
  pr: PullRequest;
}

function checkLabel(check: StatusCheck): string {
  return check.name ?? check.context ?? "Unknown";
}

function checkStatusText(check: StatusCheck): string {
  if (check.status !== "COMPLETED") {
    switch (check.status) {
      case "IN_PROGRESS":
        return "In Progress";
      case "QUEUED":
        return "Queued";
      case "PENDING":
        return "Pending";
      default:
        return check.status ?? "Unknown";
    }
  }

  const conclusion = check.conclusion ?? check.state ?? null;
  switch (conclusion) {
    case "SUCCESS":
      return "Passed";
    case "FAILURE":
      return "Failed";
    case "CANCELLED":
      return "Cancelled";
    case "TIMED_OUT":
      return "Timed Out";
    case "ACTION_REQUIRED":
      return "Action Required";
    case "NEUTRAL":
      return "Neutral";
    case "SKIPPED":
      return "Skipped";
    default:
      return "Unknown";
  }
}

function checkSymbol(check: StatusCheck): { symbol: string; color: string } {
  if (check.status !== "COMPLETED") {
    return { symbol: "○", color: "yellow" };
  }
  const conclusion = check.conclusion ?? check.state ?? null;
  switch (conclusion) {
    case "SUCCESS":
      return { symbol: "✔", color: "green" };
    case "FAILURE":
    case "ACTION_REQUIRED":
      return { symbol: "✘", color: "red" };
    case "CANCELLED":
    case "TIMED_OUT":
      return { symbol: "✘", color: "red" };
    case "NEUTRAL":
      return { symbol: "–", color: "blue" };
    case "SKIPPED":
      return { symbol: "–", color: "gray" };
    default:
      return { symbol: "○", color: "yellow" };
  }
}

function mergeableLabel(mergeable: string): { label: string; color: string } {
  switch (mergeable) {
    case "MERGEABLE":
      return { label: "Mergeable", color: "green" };
    case "CONFLICTING":
      return { label: "Conflicts", color: "red" };
    case "UNKNOWN":
      return { label: "Checking…", color: "yellow" };
    default:
      return { label: mergeable, color: "yellow" };
  }
}

export function DetailPanel({ pr }: DetailPanelProps) {
  const checks = pr.statusCheckRollup ?? [];
  const mergeStatus = mergeableLabel(pr.mergeable);

  return (
    <Box
      borderStyle="round"
      borderColor="cyan"
      flexDirection="column"
      paddingX={1}
      paddingY={1}
      marginTop={1}
    >
      <Text bold>
        PR #{pr.number} — {pr.title}
      </Text>

      <Box marginTop={1} gap={4}>
        <Box>
          <Text dimColor>Merge: </Text>
          <Text color={mergeStatus.color}>{mergeStatus.label}</Text>
        </Box>
        <Box>
          <Text dimColor>URL: </Text>
          <Text underline wrap="truncate-end">
            {pr.url}
          </Text>
        </Box>
      </Box>

      {checks.length > 0 && (
        <>
          <Box marginTop={1}>
            <Text dimColor bold>
              CI Checks ({checks.length}):
            </Text>
          </Box>
          {checks.map((check, i) => {
            const { symbol, color } = checkSymbol(check);
            return (
              <Box key={i} marginLeft={2}>
                <Box width={3}>
                  <Text color={color}>{symbol}</Text>
                </Box>
                <Box width={40}>
                  <Text wrap="truncate-end">{checkLabel(check)}</Text>
                </Box>
                <Box>
                  <Text dimColor>{checkStatusText(check)}</Text>
                </Box>
              </Box>
            );
          })}
        </>
      )}

      {checks.length === 0 && (
        <Box marginTop={1}>
          <Text dimColor>No CI checks yet.</Text>
        </Box>
      )}
    </Box>
  );
}
