import React from "react";
import { Box, Text } from "ink";
import type { PullRequest, StatusCheck, Review } from "../types";
import type { SubscriptionManager } from "../lib/subscriptions";

interface DetailPanelProps {
  pr: PullRequest;
  subs: SubscriptionManager;
  subVersion: number;
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

function approvalLabel(
  reviews: Review[] | null,
): { label: string; color: string } {
  if (!reviews || reviews.length === 0)
    return { label: "No reviews", color: "yellow" };
  const approved = reviews.some((r) => r.state === "APPROVED");
  const changesRequested = reviews.some((r) => r.state === "CHANGES_REQUESTED");
  if (approved) return { label: "Approved", color: "green" };
  if (changesRequested) return { label: "Changes requested", color: "red" };
  return { label: "Pending review", color: "yellow" };
}

export function DetailPanel({
  pr,
  subs,
  subVersion,
}: DetailPanelProps) {
  const checks = pr.statusCheckRollup ?? [];
  const mergeStatus = mergeableLabel(pr.mergeable);
  const approval = approvalLabel(pr.reviews ?? null);
  const isSubscribed = subs.has(pr.number);

  return (
    <Box
      borderStyle="round"
      borderColor="cyan"
      flexDirection="column"
      paddingX={1}
      paddingY={1}
      marginTop={1}
    >
      <Box justifyContent="space-between">
        <Text bold>
          PR #{pr.number} — {pr.title}
        </Text>
        <Text color="cyan" bold>
          {isSubscribed ? "◆ subscribed" : "  "}
        </Text>
      </Box>

      <Box marginTop={1} gap={4}>
        <Box>
          <Text dimColor>Merge: </Text>
          <Text color={mergeStatus.color}>{mergeStatus.label}</Text>
        </Box>
        <Box>
          <Text dimColor>Review: </Text>
          <Text color={approval.color}>{approval.label}</Text>
        </Box>
      </Box>

      <Box marginTop={1}>
        <Text dimColor>URL: </Text>
        <Text underline wrap="truncate-end">
          {pr.url}
        </Text>
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

      <Box marginTop={1}>
        <Text dimColor>
          Press {"s"} to {isSubscribed ? "unsubscribe" : "subscribe"}
        </Text>
      </Box>
    </Box>
  );
}
