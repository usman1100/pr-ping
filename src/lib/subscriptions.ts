import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { logger } from "./logger";

const CONFIG_DIR = `${process.env.HOME}/.config/pr-ping`;
const FILE = `${CONFIG_DIR}/subscriptions.json`;

export class SubscriptionManager {
  private subs: Set<number>;

  constructor() {
    this.subs = new Set<number>();
    this.load();
  }

  private load(): void {
    try {
      if (existsSync(FILE)) {
        const data = JSON.parse(readFileSync(FILE, "utf-8")) as number[];
        this.subs = new Set(data);
        logger.info({ count: this.subs.size }, "subscriptions loaded");
      }
    } catch {
      logger.warn("failed to load subscriptions, starting fresh");
      this.subs = new Set();
    }
  }

  private save(): void {
    try {
      mkdirSync(CONFIG_DIR, { recursive: true });
      writeFileSync(FILE, JSON.stringify([...this.subs]));
      logger.debug({ count: this.subs.size }, "subscriptions saved");
    } catch (err) {
      logger.error({ err }, "failed to save subscriptions");
    }
  }

  has(num: number): boolean {
    return this.subs.has(num);
  }

  remove(num: number): void {
    logger.info({ pr: num }, "subscription removed");
    this.subs.delete(num);
    this.save();
  }

  toggle(num: number): boolean {
    if (this.subs.has(num)) {
      this.subs.delete(num);
      this.save();
      logger.info({ pr: num }, "unsubscribed");
      return false;
    }
    this.subs.add(num);
    this.save();
    logger.info({ pr: num }, "subscribed");
    return true;
  }

  get count(): number {
    return this.subs.size;
  }

  [Symbol.iterator](): Iterator<number> {
    return this.subs.values();
  }
}
