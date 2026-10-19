export const LEADERBOARD_REFRESH_MS = 5000;

export function pollLeaderboard<T>(options: {
  load: (signal: AbortSignal) => Promise<T>;
  update: (data: T) => void;
  failed: () => void;
  visible: () => boolean;
}) {
  let stopped = false;
  let pending: AbortController | null = null;
  async function refresh() {
    if (stopped || pending || !options.visible()) return;
    const controller = new AbortController();
    pending = controller;
    const timeout = setTimeout(() => controller.abort(), 10000);
    try {
      const data = await options.load(controller.signal);
      if (!stopped) options.update(data);
    } catch { if (!stopped) options.failed(); }
    finally { clearTimeout(timeout); pending = null; }
  }
  const timer = setInterval(() => void refresh(), LEADERBOARD_REFRESH_MS);
  return {
    refresh,
    stop() { stopped = true; clearInterval(timer); pending?.abort(); },
  };
}
