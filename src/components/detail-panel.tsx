import React from "react";
import { Box, Text } from "ink";
import type { PullRequest, StatusCheck, Review, Label } from "../types";
import type { SubscriptionManager } from "../lib/subscriptions";

interface DetailPanelProps {
  pr: PullRequest;
  subs: SubscriptionManager;
  subVersion: number;
}

function relativeTime(dateStr?: string): string {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return `${Math.floor(d / 30)}mo ago`;
}

function checkLabel(check: StatusCheck): string {
  return check.name ?? check.context ?? "Unknown";
}

function checkStatusText(check: StatusCheck): string {
  const conclusion = check.conclusion ?? check.state ?? null;

  if (check.status !== "COMPLETED") {
    switch (check.status) {
      case "IN_PROGRESS":
        return "In Progress";
      case "QUEUED":
        return "Queued";
      case "PENDING":
        return "Pending";
      default:
        return conclusion ?? check.status ?? "Unknown";
    }
  }

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

function checkSymbol(
  check: StatusCheck,
): { symbol: string; color: string } {
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
  if (changesRequested)
    return { label: "Changes requested", color: "red" };
  return { label: "Pending review", color: "yellow" };
}

function reviewerList(
  reviews: Review[] | null,
  reviewRequests?: { requestedReviewer?: { __typename?: string; login: string } }[] | null,
): string {
  const reviewed = new Map<string, string>();
  for (const r of reviews ?? []) {
    if (r.author?.login) {
      reviewed.set(r.author.login, r.state);
    }
  }
  const parts: string[] = [];
  for (const [login, state] of reviewed) {
    const icon =
      state === "APPROVED"
        ? "✅"
        : state === "CHANGES_REQUESTED"
          ? "❌"
          : "💬";
    parts.push(`${icon} ${login}`);
  }
  for (const rr of reviewRequests ?? []) {
    const login = rr.requestedReviewer?.login;
    if (login && !reviewed.has(login)) {
      parts.push(`⏳ ${login}`);
    }
  }
  return parts.join("  ") || "None";
}

function shortBody(body: string | undefined, maxLines = 8): string {
  if (!body) return "";
  const lines = body.split("\n");
  const trimmed: string[] = [];
  let blankCount = 0;
  for (const line of lines) {
    if (line.trim() === "") {
      blankCount++;
      if (blankCount > 2) continue;
    } else {
      blankCount = 0;
    }
    trimmed.push(line);
    if (trimmed.length >= maxLines) {
      trimmed.push("…");
      break;
    }
  }
  return trimmed.join("\n");
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
  const bodyPreview = shortBody(pr.body);
  const reviewers = reviewerList(pr.reviews ?? null, pr.reviewRequests ?? null);

  return (
    <Box
      borderStyle="round"
      borderColor="cyan"
      flexDirection="column"
      paddingX={1}
      paddingY={1}
      marginTop={0}
    >
      <Box justifyContent="space-between">
        <Text bold>
          PR #{pr.number} — {pr.title}
        </Text>
        <Text color="cyan" bold>
          {isSubscribed ? "◆ subscribed" : ""}
        </Text>
      </Box>

      <Box marginTop={1} gap={2}>
        <Box>
          <Text dimColor>Status: </Text>
          <Text color={pr.isDraft ? "yellow" : "green"}>
            {pr.isDraft ? "Draft" : pr.state ?? "Open"}
          </Text>
        </Box>
        <Box>
          <Text dimColor>Merge: </Text>
          <Text color={mergeStatus.color}>{mergeStatus.label}</Text>
        </Box>
        <Box>
          <Text dimColor>Review: </Text>
          <Text color={approval.color}>{approval.label}</Text>
        </Box>
      </Box>

      <Box marginTop={0} gap={2}>
        <Box>
          <Text dimColor>Author: </Text>
          <Text>@{pr.author?.login ?? "unknown"}</Text>
        </Box>
        <Box>
          <Text dimColor>Created: </Text>
          <Text dimColor>{relativeTime(pr.createdAt)}</Text>
        </Box>
        <Box>
          <Text dimColor>Updated: </Text>
          <Text dimColor>{relativeTime(pr.updatedAt)}</Text>
        </Box>
      </Box>

      <Box marginTop={0}>
        <Text dimColor>URL: </Text>
        <Text underline wrap="truncate-end">
          {pr.url}
        </Text>
      </Box>

      {pr.labels && pr.labels.length > 0 && (
        <Box marginTop={0} gap={1}>
          <Text dimColor>Labels:</Text>
          {pr.labels.map((l, i) => (
            <Text key={i} color="yellow">
              [{l.name}]
            </Text>
          ))}
        </Box>
      )}

      {bodyPreview && (
        <Box
          marginTop={1}
          borderStyle="single"
          borderDimColor
          flexDirection="column"
          paddingX={1}
        >
          {bodyPreview.split("\n").map((line, i) => (
            <Text key={i} wrap="truncate-end" dimColor>
              {line || " "}
            </Text>
          ))}
        </Box>
      )}

      {checks.length > 0 && (
        <>
          <Box marginTop={1}>
            <Text bold dimColor>
              CI Checks ({checks.length}):
            </Text>
          </Box>
          {checks.map((check, i) => {
            const { symbol, color } = checkSymbol(check);
            return (
              <Box key={i} marginLeft={1}>
                <Box width={2}>
                  <Text color={color}>{symbol}</Text>
                </Box>
                <Box width={38}>
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

      {reviewers !== "None" && (
        <Box marginTop={1}>
          <Text dimColor bold>
            Reviewers:
          </Text>
          <Text>{reviewers}</Text>
        </Box>
      )}

      <Box marginTop={1} justifyContent="center" gap={2}>
        <Text dimColor>s subscribe</Text>
        <Text dimColor>o open</Text>
        <Text dimColor>y copy URL</Text>
        <Text dimColor>Esc close</Text>
      </Box>
    </Box>
  );
}
