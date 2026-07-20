import { StateTracker } from "./state";
import { checkAuth, fetchMyPRs, RateLimitError } from "./github";
import { createNotifier } from "./notifier";

const POLL_INTERVAL = 5000;
const RATE_LIMIT_INTERVAL = 30000;

const state = new StateTracker();
let notifier: ReturnType<typeof createNotifier>;
let running = true;

process.on("SIGINT", () => {
  running = false;
});
process.on("SIGTERM", () => {
  running = false;
});

async function main() {
  try {
    notifier = createNotifier();
  } catch (err) {
    console.error(err instanceof Error ? err.message : String(err));
    process.exit(1);
  }

  checkAuth();
  console.log("gh-pr-monitor started. Polling every 5s...");

  let pollInterval = POLL_INTERVAL;

  while (running) {
    try {
      const prs = fetchMyPRs();
      const newlyReady = state.update(prs);

      for (const pr of newlyReady) {
        console.log(`PR #${pr.number} is now ready: ${pr.title}`);
        notifier.notify("PR Ready!", `#${pr.number}: ${pr.title}`, pr.url);
      }

      pollInterval = POLL_INTERVAL;
    } catch (err) {
      if (err instanceof RateLimitError) {
        console.warn("Rate limit hit, backing off to 30s intervals");
        pollInterval = RATE_LIMIT_INTERVAL;
      } else {
        const message = err instanceof Error ? err.message : String(err);
        console.error("Poll error:", message);
      }
    }

    await Bun.sleep(pollInterval);
  }

  console.log("gh-pr-monitor stopped.");
}

main();
