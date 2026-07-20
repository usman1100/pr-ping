import React from "react";
import { Box, Text } from "ink";
import type { PullRequest, StatusCheck, Review } from "../types";

interface PRRowProps {
  pr: PullRequest;
  isSelected: boolean;
  isSubscribed: boolean;
}

function relativeTime(dateStr?: string): string {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 10) return "now";
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d`;
  return `${Math.floor(d / 30)}mo`;
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

function approvalBadge(reviews: Review[] | null): {
  label: string;
  color: string;
} {
  if (!reviews || reviews.length === 0)
    return { label: "○", color: "yellow" };
  const approved = reviews.some((r) => r.state === "APPROVED");
  const changesRequested = reviews.some((r) => r.state === "CHANGES_REQUESTED");
  if (approved) return { label: "●", color: "green" };
  if (changesRequested) return { label: "●", color: "red" };
  return { label: "○", color: "yellow" };
}

function isCheckCompleted(check: StatusCheck): boolean {
  if (check.status === "COMPLETED") return true;
  if (check.conclusion != null) return true;
  if (check.state != null) return true;
  return false;
}

function checkSymbol(check: StatusCheck): string {
  if (!isCheckCompleted(check)) return "○";
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

function checkColor(check: StatusCheck): string {
  if (!isCheckCompleted(check)) return "yellow";
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

function ciSummary(checks: StatusCheck[]): string {
  if (checks.length === 0) return "○";
  const dots = checks
    .slice(0, 4)
    .map((c) => {
      const sym = checkSymbol(c);
      const col = checkColor(c);
      return { sym, col };
    });
  const text = dots.map((d) => d.sym).join("");
  if (checks.length > 4) return text + `+${checks.length - 4}`;
  return text;
}

export function PRRow({ pr, isSelected, isSubscribed }: PRRowProps) {
  const mergeStatus = mergeableBadge(pr.mergeable);
  const approval = approvalBadge(pr.reviews ?? null);
  const checks = pr.statusCheckRollup ?? [];
  const cursorChar = isSelected ? "▸" : " ";
  const subChar = isSubscribed ? "◆" : " ";
  const time = relativeTime(pr.updatedAt ?? pr.createdAt);
  const author = pr.author?.login ?? "";
  const ciExtra = checks.length > 4 ? `+${checks.length - 4}` : null;

  return (
    <Box>
      <Box width={3} marginRight={1}>
        <Text>
          <Text color={isSelected ? "cyan" : undefined}>{cursorChar}</Text>
          <Text color={isSubscribed ? "cyan" : undefined}>{subChar}</Text>
        </Text>
      </Box>

      <Box width={6} marginRight={1}>
        <Text bold={isSelected} color={isSelected ? "cyan" : "gray"}>
          #{pr.number}
        </Text>
      </Box>

      <Box flexGrow={1} marginRight={1}>
        <Text bold={isSelected} wrap="truncate-end">
          <Text color={isSelected ? undefined : undefined}>
            {pr.title}
          </Text>
          {pr.isDraft && (
            <Text color="yellow" dimColor>
              {" "}[DRAFT]
            </Text>
          )}
        </Text>
      </Box>

      <Box width={3} justifyContent="center" marginRight={1}>
        <Text color={mergeStatus.color}>{mergeStatus.label}</Text>
      </Box>

      <Box width={3} justifyContent="center" marginRight={1}>
        <Text color={approval.color}>{approval.label}</Text>
      </Box>

      <Box width={checks.length === 0 ? 2 : Math.min(checks.length, 4) + (ciExtra ? ciExtra.length : 0) + 1} marginRight={1}>
        {checks.length === 0 ? (
          <Text color="yellow">○</Text>
        ) : (
          <>
            {checks.slice(0, 4).map((c, i) => (
              <Text key={i} color={checkColor(c)}>
                {checkSymbol(c)}
              </Text>
            ))}
            {ciExtra && <Text dimColor>{ciExtra}</Text>}
          </>
        )}
      </Box>

      <Box width={7} marginRight={1}>
        <Text dimColor wrap="truncate-end">
          {time}
        </Text>
      </Box>

      <Box width={10}>
        <Text dimColor wrap="truncate-end">
          @{author}
        </Text>
      </Box>
    </Box>
  );
}
