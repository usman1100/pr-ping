import React from "react";
import { render } from "ink";
import { statSync } from "node:fs";
import { checkAuth } from "./lib/github";
import App from "./app";

const repoPath = process.argv[2];
if (!repoPath) {
  console.error("Usage: gh-watch <repo-path>");
  process.exit(1);
}

try {
  statSync(repoPath);
} catch {
  console.error(`Error: path does not exist — ${repoPath}`);
  process.exit(1);
}

checkAuth();

render(<App repoPath={repoPath} />);
