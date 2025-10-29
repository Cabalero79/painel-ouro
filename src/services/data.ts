import { toUnix } from '../utils/indicators'
import type { UTCTimestamp } from 'lightweight-charts'

export type Candle = {
  time: UTCTimestamp
  open: number
  high: number
  low: number
  close: number
}

export type NewsItem = {
  title: string
  url: string
  publishedAt: string
  score: number
}

// Vocabulário simples para sentimento (mock)
const POSITIVE = ['otimista','alta','subida','cresce','recorde','acima','fluxo comprador']
const NEGATIVE = ['queda','baixa','crise','alerta','abaixo','despenca','fluxo vendedor']

export function simpleSentiment(text: string): number {
  const t = text.toLowerCase()
  let score = 0
  POSITIVE.forEach(w => { if (t.includes(w)) score += 1 })
  NEGATIVE.forEach(w => { if (t.includes(w)) score -= 1 })
  return score
}

/** Gera candles MOCK (para dev/offline) */
export function genMockCandles(points = 120, startPrice = 2350): Candle[] {
  const out: Candle[] = []
  let price = startPrice
  const now = Date.now()

  for (let i = points - 1; i >= 0; i--) {
    const t = new Date(now - i * 60_000)
    const drift = (Math.random() - 0.5) * 4
    const open = price
    const close = Math.max(1, open + drift)
    const high = Math.max(open, close) + Math.random() * 2.5
    const low = Math.min(open, close) - Math.random() * 2.5
    price = close

    out.push({
      time: (Math.floor(t.getTime() / 1000) as unknown) as UTCTimestamp,
      open, high, low, close,
    })
  }
  return out
}

/** Agrega candles em janelas de N minutos (ex.: 15min, 60min etc.) */
export function aggregate(candles: Candle[], minutes = 5): Candle[] {
  if (minutes <= 1) return candles
  const out: Candle[] = []
  let bucket: Candle[] = []

  for (const c of candles) {
    bucket.push(c)
    if (bucket.length === minutes) {
      const o = bucket[0].open
      const h = Math.max(...bucket.map(b => b.high))
      const l = Math.min(...bucket.map(b => b.low))
      const cl = bucket[bucket.length - 1].close
      out.push({ time: bucket[0].time, open: o, high: h, low: l, close: cl })
      bucket = []
    }
  }

  if (bucket.length) {
    const o = bucket[0].open
    const h = Math.max(...bucket.map(b => b.high))
