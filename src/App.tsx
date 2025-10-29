
import React, { useEffect, useMemo, useState } from 'react'
import { ArrowDownRight, ArrowUpRight, Newspaper } from 'lucide-react'
import CandleChart from './components/CandleChart'
import { aggregate, DATA_SOURCE, fetchLiveCandles, fetchNews, genMockCandles, type Candle, type NewsItem } from './services/data'
import { ema, rsi, macd, pct } from './utils/indicators'

const DEFAULT_ASSET = 'XAUUSD'
const SUPPORTED_ASSETS = [
  { sym: 'XAUUSD', label: 'Ouro (XAUUSD)' },
  { sym: 'GLD', label: 'ETF GLD' },
  { sym: 'GC=F', label: 'Futuro de Ouro (COMEX)' },
]

const TF_CONFIG: Record<string, { label: string; points: number; intervalMin: number }> = {
  '1h': { label: 'Hora', points: 120, intervalMin: 1 },
  '1d': { label: 'Dia', points: 96, intervalMin: 15 },
  '1w': { label: 'Semana', points: 70, intervalMin: 60 },
  '15d': { label: 'Quinzena', points: 90, intervalMin: 120 },
  '1m': { label: 'Mensal', points: 120, intervalMin: 240 },
}

export default function App() {
  const [asset, setAsset] = useState<string>(DEFAULT_ASSET)
  const [loading, setLoading] = useState(false)
  const [candlesByTf, setCandlesByTf] = useState<Record<string, Candle[]>>({})
  const [news, setNews] = useState<NewsItem[]>([])
  const [activeTab, setActiveTab] = useState<keyof typeof TF_CONFIG>('1h')

  async function loadAll(sym: string) {
    setLoading(true)
    try {
      const next: Record<string, Candle[]> = {}
      for (const [tf, cfg] of Object.entries(TF_CONFIG)) {
        const raw = DATA_SOURCE === 'mock' ? genMockCandles(cfg.points, 2350 + Math.random() * 30) : await fetchLiveCandles(sym, cfg.points, cfg.intervalMin)
        next[tf] = aggregate(raw, cfg.intervalMin)
      }
      setCandlesByTf(next)
      const n = await fetchNews(sym); setNews(n)
    } finally { setLoading(false) }
  }

  useEffect(() => { loadAll(asset) }, [asset])

  const priceNow = useMemo(() => candlesByTf['1d']?.slice(-1)?.[0]?.close ?? 0, [candlesByTf])
  const pricePrev = useMemo(() => candlesByTf['1d']?.slice(-2, -1)?.[0]?.close ?? priceNow, [candlesByTf, priceNow])
  const priceChg = pct(priceNow, pricePrev)

  const indicators = useMemo(() => {
    const basis = candlesByTf['1d'] || candlesByTf['1h'] || []
    const closes = basis.map(c => c.close)
    const ema20 = ema(closes, 20)
    const ema50 = ema(closes, 50)
    const rsi14 = rsi(closes, 14)
    const { macdLine, signalLine, hist } = macd(closes)
    const i = closes.length - 1
    return {
      price: closes[i] ?? null,
      ema20: ema20[i] ?? null,
      ema50: ema50[i] ?? null,
      rsi14: rsi14[i] ?? null,
      macd: macdLine[i] ?? null,
      macdSignal: signalLine[i] ?? null,
      macdHist: hist[i] ?? null,
    }
  }, [candlesByTf])

  const sentiment = useMemo(() => news.reduce((acc, n) => acc + n.score, 0), [news])

  const decision = useMemo(() => {
    let score = 0
    if (indicators.ema20 != null && indicators.ema50 != null) score += indicators.ema20 > indicators.ema50 ? 1 : -1
    if (indicators.macdHist != null) score += indicators.macdHist > 0 ? 1 : -1
    if (indicators.rsi14 != null) score += indicators.rsi14 > 50 && indicators.rsi14 < 70 ? 1 : indicators.rsi14 < 45 ? -1 : 0
    score += sentiment / 2
    const label = score >= 1 ? 'Comprar' : score <= -1 ? 'Vender' : 'Neutro'
    return { score, label }
  }, [indicators, sentiment])

  return (
    <div className="container">
      <div className="header">
        <div>
          <h1 className="h1">Painel de Ouro — Compra/Venda</h1>
          <div className="sub">Visão consolidada do mercado mundial do ouro (candles, indicadores e notícias).</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <select className="select" value={asset} onChange={e => setAsset(e.target.value)}>
            {SUPPORTED_ASSETS.map(a => <option key={a.sym} value={a.sym}>{a.label}</option>)}
          </select>
          <button className="btn" onClick={() => loadAll(asset)} disabled={loading}>{loading ? 'Atualizando...' : 'Atualizar'}</button>
        </div>
      </div>

      <div className="row row-3">
        <div className="card">
          <div className="title">Preço atual</div>
          <div className="body kpi">
            <div className="value">{priceNow ? priceNow.toFixed(2) : '—'}</div>
            <div className="badge" style={{ color: priceChg >= 0 ? 'var(--up)' : 'var(--down)' }}>
              {priceChg >= 0 ? <ArrowUpRight size={16}/> : <ArrowDownRight size={16}/>}
              {isFinite(priceChg) ? `${priceChg.toFixed(2)}%` : '0.00%'}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="title">Indicadores (1d)</div>
          <div className="body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 14 }}>
            <div><div className="sub">EMA 20</div><div style={{ fontWeight: 700 }}>{indicators.ema20?.toFixed(2) ?? '—'}</div></div>
            <div><div className="sub">EMA 50</div><div style={{ fontWeight: 700 }}>{indicators.ema50?.toFixed(2) ?? '—'}</div></div>
            <div><div className="sub">RSI 14</div><div style={{ fontWeight: 700 }}>{indicators.rsi14?.toFixed(1) ?? '—'}</div></div>
            <div>
              <div className="sub">MACD Hist</div>
              <div style={{ fontWeight: 700, color: (indicators.macdHist ?? 0) > 0 ? 'var(--up)' : 'var(--down)' }}>{indicators.macdHist?.toFixed(3) ?? '—'}</div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="title">Sinal consolidado</div>
          <div className="body kpi">
            <div>
              <div className="sub">Score</div>
              <div className="value">{decision.score.toFixed(2)}</div>
            </div>
            <div className="badge" style={{ background: decision.label === 'Comprar' ? '#0f2b1c' : decision.label === 'Vender' ? '#311217' : '#0d1629', borderColor: '#1f2a40' }}>
              {decision.label}
            </div>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <div className="title">Gráficos de Candles</div>
        <div className="body">
          <div className="tabs">
            {Object.entries(TF_CONFIG).map(([tf, cfg]) => (
              <button key={tf} className={`tab ${activeTab === tf ? 'active' : ''}`} onClick={() => setActiveTab(tf as keyof typeof TF_CONFIG)}>{cfg.label}</button>
            ))}
          </div>
          <div style={{ marginTop: 12 }}>
            {Object.entries(TF_CONFIG).map(([tf]) => (
              <div key={tf} style={{ display: activeTab === tf ? 'block' : 'none' }}>
                <CandleChart data={candlesByTf[tf] || []} height={320} />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="row row-2" style={{ marginTop: 16 }}>
        <div className="card">
          <div className="title">Notícias que podem virar estratégia <span className="sub"> (sentimento: {sentiment.toFixed(1)})</span></div>
          <div className="body">
            {news.map((n, i) => (
              <a key={i} href={n.url} target="_blank" rel="noreferrer" className="news-item">
                <div className="news-meta"><Newspaper size={16} /> {new Date(n.publishedAt).toLocaleString()}</div>
                <div style={{ marginTop: 6, fontWeight: 600 }}>{n.title}</div>
                <div className="news-sent" style={{ color: n.score > 0 ? 'var(--up)' : n.score < 0 ? 'var(--down)' : 'var(--muted)' }}>
                  sentimento: {n.score > 0 ? '+' : ''}{n.score}
                </div>
              </a>
            ))}
          </div>
        </div>
        <div className="card">
          <div className="title">Regras de Sinal (edite à vontade)</div>
          <div className="body" style={{ fontSize: 14, color: 'var(--text)' }}>
            <ul>
              <li><b>Comprar</b> quando: EMA20 &gt; EMA50, MACD Hist &gt; 0, RSI 50–70 e sentimento ≥ 0.</li>
              <li><b>Vender</b> quando: EMA20 &lt; EMA50, MACD Hist &lt; 0, RSI &lt; 45 ou sentimento &lt; 0.</li>
              <li><b>Neutro</b> quando sinais mistos — aguardar confirmação.</li>
            </ul>
            <div style={{ marginTop: 8, color: 'var(--muted)', fontSize: 12 }}>
              *Painel educativo. Não constitui recomendação financeira. Ajuste as regras ao seu perfil de risco.
            </div>
          </div>
        </div>
      </div>

      <div className="footer" style={{ marginTop: 16 }}>
        <span>Para dados em tempo real, troque <code>DATA_SOURCE</code> para <b>'live'</b> e implemente <code>fetchLiveCandles</code>/<code>fetchNews</code> com sua API (Finnhub/Polygon/AlphaVantage/TwelveData/NewsAPI/GDELT).</span>
      </div>
    </div>
  )
}
