export interface Notifier {
  notify(title: string, message: string, url: string): Promise<void>;
}
