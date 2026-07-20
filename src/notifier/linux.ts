import type { Notifier } from "./types";

export const linuxNotifier: Notifier = {
  async notify(title: string, message: string, url: string) {
    Bun.spawnSync(["notify-send", title, message]);
  },
};
