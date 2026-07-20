import React from "react";
import { Box, Text, useWindowSize } from "ink";

interface HelpOverlayProps {
  onClose: () => void;
}

const HELP_ITEMS = [
  { key: "↑ ↓ / j k", desc: "Navigate list" },
  { key: "g / G", desc: "Go to top / bottom" },
  { key: "Enter", desc: "Toggle detail panel" },
  { key: "Esc", desc: "Close panel / cancel search" },
  { key: "1 / 2 / 3", desc: "All / Mine / Subscribed" },
  { key: "/", desc: "Search PRs" },
  { key: "s", desc: "Subscribe / unsubscribe" },
  { key: "o", desc: "Open in browser" },
  { key: "y", desc: "Copy URL to clipboard" },
  { key: "r", desc: "Force refresh" },
  { key: "?", desc: "Toggle this help" },
  { key: "q", desc: "Quit" },
];

export function HelpOverlay({ onClose }: HelpOverlayProps) {
  const { columns, rows } = useWindowSize();

  const boxWidth = Math.min(50, columns - 4);
  const boxHeight = HELP_ITEMS.length + 4;

  // We use useInput in the parent to handle ?/Esc, this component is purely visual
  return (
    <Box
      position="absolute"
      top={0}
      left={0}
      width={columns}
      height={rows}
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
    >
      <Box
        borderStyle="round"
        borderColor="cyan"
        flexDirection="column"
        paddingX={2}
        paddingY={1}
        width={boxWidth}
      >
        <Box justifyContent="center">
          <Text bold color="cyan">Keyboard Shortcuts</Text>
        </Box>
        <Text dimColor>────────────────────</Text>
        {HELP_ITEMS.map((item, i) => (
          <Box key={i} justifyContent="space-between">
            <Box width={20}>
              <Text bold>{item.key}</Text>
            </Box>
            <Text dimColor>{item.desc}</Text>
          </Box>
        ))}
        <Text dimColor>────────────────────</Text>
        <Box justifyContent="center">
          <Text dimColor>Press ? or Esc to close</Text>
        </Box>
      </Box>
    </Box>
  );
}
