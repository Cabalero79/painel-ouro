import { toUnix } from '../utils/indicators'
import type { UTCTimestamp } from 'lightweight-charts'

export type Candle = { time: UTCTimestamp; open: number; high: number; low: number; close: number };
export type NewsItem = { title: string; url: string; publishedAt: string; score: number };

// ... (resto igual)

export function genMockCandles(points = 120, startPrice = 2350): Candle[] {
  const out: Candle[] = []; let price = startPrice; const now = Date.now();
  for (let i = points - 1; i >= 0; i--) {
    const t = new Date(now - i * 60_000);
    const drift = (Math.random() - 0.5) * 4;
    const open = price; const close = Math.max(1, open + drift);
    const high = Math.max(open, close) + Math.random() * 2.5;
    const low = Math.min(open, close) - Math.random() * 2.5;
    price = close;
    out.push({
      time: toUnix(t) as UTCTimestamp,
      open, high, low, close
    });
  }
  return out;
}
