import type { Notifier } from "./types";

function escape(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n");
}

export const macosNotifier: Notifier = {
  async notify(title: string, _message: string, _url: string) {
    const script = `display notification "${escape(_message)}" with title "${escape(title)}" sound name "Glass"`;
    Bun.spawnSync(["osascript", "-e", script]);
  },
};
