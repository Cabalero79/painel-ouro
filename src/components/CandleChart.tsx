import React, { useEffect, useRef } from 'react'
import {
  createChart,
  ColorType,
  ISeriesApi,
  CandlestickData,
  Time,
  UTCTimestamp,
} from 'lightweight-charts'
import type { Candle } from '../services/data'

export default function CandleChart({ data, height = 300 }: { data: Candle[]; height?: number }) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null)
  const chartRef = useRef<ReturnType<typeof createChart> | null>(null)

  useEffect(() => {
    if (!containerRef.current) return
    const chart = createChart(containerRef.current, {
      height,
      layout: { background: { type: ColorType.Solid, color: 'transparent' }, textColor: '#e6eefc' },
      grid: { horzLines: { color: '#1f2a40' }, vertLines: { color: '#1f2a40' } },
      crosshair: { mode: 0 },
      rightPriceScale: { borderColor: '#1f2a40' },
      timeScale: { borderColor: '#1f2a40' },
    })
    const series = chart.addCandlestickSeries({
      upColor: '#16a34a', downColor: '#dc2626',
      wickUpColor: '#16a34a', wickDownColor: '#dc2626', borderVisible: false,
    })
    chartRef.current = chart
    seriesRef.current = series

    const handleResize = () => chart.applyOptions({ width: containerRef.current?.clientWidth || 600 })
    handleResize(); window.addEventListener('resize', handleResize)
    return () => { window.removeEventListener('resize', handleResize); chart.remove(); chartRef.current = null; seriesRef.current = null }
  }, [height])

  useEffect(() => {
    if (!seriesRef.current) return
    // Converte nosso Candle para o formato do lightweight-charts
    const chartData: CandlestickData<Time>[] = data.map(c => ({
      time: c.time as UTCTimestamp,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
    }))
    seriesRef.current.setData(chartData)
    chartRef.current?.timeScale().fitContent()
  }, [data])

  return <div ref={containerRef} style={{ width: '100%' }} />
}
