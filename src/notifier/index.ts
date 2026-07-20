import type { Notifier } from "./types";
import { macosNotifier } from "./macos";
import { linuxNotifier } from "./linux";

export function createNotifier(): Notifier {
  switch (process.platform) {
    case "darwin":
      return macosNotifier;
    case "linux":
      return linuxNotifier;
    case "win32":
      throw new Error("Windows support not yet implemented");
    default:
      throw new Error(`Unsupported platform: ${process.platform}`);
  }
}
