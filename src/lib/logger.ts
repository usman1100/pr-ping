import pino from "pino";
import { openSync, mkdirSync, statSync, renameSync } from "node:fs";

const LOG_DIR = `${process.env.HOME}/.config/pr-ping`;
const LOG_FILE = `${LOG_DIR}/pr-ping.log`;
const MAX_SIZE = 100 * 1024 * 1024;
const LOG_LEVEL = process.env.LOG_LEVEL || "info";

mkdirSync(LOG_DIR, { recursive: true });

const fd = openSync(LOG_FILE, "a");
const destination = pino.destination({ dest: LOG_FILE, fd, sync: true });

export const logger = pino({ level: LOG_LEVEL }, destination);

const ROTATE_INTERVAL = 60_000;
setInterval(() => {
  try {
    const { size } = statSync(LOG_FILE);
    if (size >= MAX_SIZE) {
      const rotated = `${LOG_FILE}.1`;
      try {
        renameSync(LOG_FILE, rotated);
      } catch {}
      destination.reopen();
    }
  } catch {}
}, ROTATE_INTERVAL).unref();
