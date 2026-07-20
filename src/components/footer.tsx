import React from "react";
import { Box, Text } from "ink";

export function Footer() {
  return (
    <Box justifyContent="center" paddingX={1} paddingBottom={1}>
      <Text dimColor>
        ↑↓ nav · Enter detail · r refresh · q quit
      </Text>
    </Box>
  );
}
