import React from "react";
import { Box, Text } from "ink";

interface FooterProps {
  searchMode: boolean;
}

export function Footer({ searchMode }: FooterProps) {
  return (
    <Box justifyContent="center" paddingX={1} paddingBottom={1}>
      {searchMode ? (
        <Text dimColor>
          type to search · Enter search · Esc cancel
        </Text>
      ) : (
        <Text dimColor>
          ↑↓ nav · Enter detail · / search · r refresh · q quit
        </Text>
      )}
    </Box>
  );
}
