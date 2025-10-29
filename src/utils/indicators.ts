export function ema(values: number[], period: number): number[] {
  const k: number = 2 / (period + 1)
  const out: number[] = []
  let prev: number | null = null
  for (let i = 0; i < values.length; i++) {
    const v: number = values[i]
    if (prev == null) {
      prev = v
      out.push(v)
    } else {
      const next: number = v * k + (prev as number) * (1 - k)
      out.push(next)
      prev = next
    }
  }
  return out
}

export function rsi(values: number[], period = 14): number[] {
  if (values.length < 2) return values.map(() => 50)
  const gains: number[] = []
  const losses: number[] = []
  for (let i = 1; i < values.length; i++) {
    const diff = values[i] - values[i - 1]
    gains.push(Math.max(0, diff))
    losses.push(Math.max(0, -diff))
  }
  const avgGain = ema(gains, period)
  const avgLoss = ema(losses, period)
  const rsiArr: number[] = [50]
  for (let i = 0; i < avgGain.length; i++) {
    const ag: number = avgGain[i] || 0.00001
    const al: number = avgLoss[i] || 0.00001
    const rs: number = ag / al
    rsiArr.push(100 - 100 / (1 + rs))
  }
  while (rsiArr.length < values.length) rsiArr.push(rsiArr[rsiArr.length - 1] ?? 50)
  return rsiArr.slice(0, values.length)
}

export function macd(values: number[], fast = 12, slow = 26, signal = 9) {
  const emaFast = ema(values, fast)
  const emaSlow = ema(values, slow)
  const macdLine = values.map((_, i) => (emaFast[i] ?? 0) - (emaSlow[i] ?? 0))
  const signalLine = ema(macdLine, signal)
  const hist = macdLine.map((v, i) => v - (signalLine[i] ?? 0))
  return { macdLine, signalLine, hist }
}

export function pct(a?: number | null, b?: number | null) {
  if (a == null || b == null) return 0
  return ((a - b) / b) * 100
}

export function toUnix(date: Date) { return Math.floor(date.getTime() / 1000) }
