import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";

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
      }
    } catch {
      this.subs = new Set();
    }
  }

  private save(): void {
    try {
      mkdirSync(CONFIG_DIR, { recursive: true });
      writeFileSync(FILE, JSON.stringify([...this.subs]));
    } catch {}
  }

  has(num: number): boolean {
    return this.subs.has(num);
  }

  remove(num: number): void {
    this.subs.delete(num);
    this.save();
  }

  toggle(num: number): boolean {
    if (this.subs.has(num)) {
      this.subs.delete(num);
      this.save();
      return false;
    }
    this.subs.add(num);
    this.save();
    return true;
  }

  get count(): number {
    return this.subs.size;
  }

  [Symbol.iterator](): Iterator<number> {
    return this.subs.values();
  }
}
