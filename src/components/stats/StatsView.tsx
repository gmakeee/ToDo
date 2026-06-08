'use client'

import { useEffect, useState } from 'react'
import { Completion } from '@/types'
import { subDays, format, eachDayOfInterval, startOfDay, isSameDay } from 'date-fns'
import { ru } from 'date-fns/locale'

interface Props {
  telegramId: number
}

type Range = '7' | '30' | '365'

export default function StatsView({ telegramId }: Props) {
  const [range, setRange] = useState<Range>('30')
  const [completions, setCompletions] = useState<Completion[]>([])

  useEffect(() => {
    fetch(`/api/completions?telegram_id=${telegramId}&range=${range}`)
      .then((r) => r.json())
      .then(setCompletions)
  }, [range])

  const days = eachDayOfInterval({ start: subDays(new Date(), parseInt(range) - 1), end: new Date() })

  const byDay = days.map((day) => ({
    date: day,
    count: completions.filter((c) => isSameDay(new Date(c.completed_at), day)).length,
  }))

  const avgMood =
    completions.filter((c) => c.mood).reduce((s, c) => s + (c.mood ?? 0), 0) /
    (completions.filter((c) => c.mood).length || 1)

  const total = completions.length
  const maxDay = Math.max(...byDay.map((d) => d.count), 1)

  const moodEmojis = ['', '😔', '😕', '😐', '🙂', '😄']

  return (
    <div className="space-y-5">
      {/* Range selector */}
      <div className="flex gap-2">
        {(['7', '30', '365'] as Range[]).map((r) => (
          <button
            key={r}
            onClick={() => setRange(r)}
            className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
              range === r ? 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300' : 'text-muted-foreground bg-muted'
            }`}
          >
            {r === '7' ? '7 дней' : r === '30' ? '30 дней' : 'Год'}
          </button>
        ))}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-4 rounded-2xl bg-pink-50 dark:bg-pink-950/20 border border-pink-100 dark:border-pink-900/30">
          <p className="text-2xl font-bold text-pink-600">{total}</p>
          <p className="text-xs text-muted-foreground mt-1">Выполнений</p>
        </div>
        <div className="p-4 rounded-2xl bg-purple-50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/30">
          <p className="text-2xl font-bold text-purple-600">
            {completions.filter((c) => c.mood).length ? `${moodEmojis[Math.round(avgMood)]}` : '—'}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Среднее настроение</p>
        </div>
      </div>

      {/* Activity chart */}
      <div>
        <p className="text-sm font-medium mb-3">Активность</p>
        {range === '365' ? (
          <HeatmapYear byDay={byDay} maxDay={maxDay} />
        ) : (
          <BarChart byDay={byDay} maxDay={maxDay} range={parseInt(range)} />
        )}
      </div>

      {/* Mood timeline */}
      {completions.some((c) => c.mood) && (
        <div>
          <p className="text-sm font-medium mb-3">Настроение</p>
          <div className="flex items-end gap-1 h-16">
            {byDay.slice(-30).map((d) => {
              const dayMoods = completions
                .filter((c) => isSameDay(new Date(c.completed_at), d.date) && c.mood)
                .map((c) => c.mood ?? 0)
              const avg = dayMoods.length ? dayMoods.reduce((s, m) => s + m, 0) / dayMoods.length : 0
              return (
                <div key={d.date.toISOString()} className="flex-1 flex flex-col items-center justify-end gap-0.5">
                  {avg > 0 && (
                    <div
                      className="w-full rounded-t-sm bg-gradient-to-t from-pink-300 to-purple-300"
                      style={{ height: `${(avg / 5) * 100}%` }}
                    />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function BarChart({ byDay, maxDay, range }: { byDay: { date: Date; count: number }[]; maxDay: number; range: number }) {
  const shown = byDay.slice(-Math.min(range, 30))
  return (
    <div className="flex items-end gap-1 h-24">
      {shown.map((d) => (
        <div key={d.date.toISOString()} className="flex-1 flex flex-col items-center gap-1">
          <div className="w-full flex items-end justify-center" style={{ height: '80px' }}>
            <div
              className={`w-full rounded-t-sm transition-all ${d.count > 0 ? 'bg-pink-400' : 'bg-muted'}`}
              style={{ height: d.count > 0 ? `${(d.count / maxDay) * 100}%` : '4px' }}
            />
          </div>
          {shown.length <= 14 && (
            <span className="text-[9px] text-muted-foreground">
              {format(d.date, 'd', { locale: ru })}
            </span>
          )}
        </div>
      ))}
    </div>
  )
}

function HeatmapYear({ byDay, maxDay }: { byDay: { date: Date; count: number }[]; maxDay: number }) {
  const intensity = (count: number) => {
    if (count === 0) return 'bg-muted'
    const level = Math.ceil((count / maxDay) * 4)
    return ['', 'bg-pink-200', 'bg-pink-300', 'bg-pink-400', 'bg-pink-500'][level] ?? 'bg-pink-500'
  }

  return (
    <div className="flex flex-wrap gap-1">
      {byDay.map((d) => (
        <div
          key={d.date.toISOString()}
          className={`w-3 h-3 rounded-sm ${intensity(d.count)}`}
          title={`${format(d.date, 'd MMM', { locale: ru })}: ${d.count}`}
        />
      ))}
    </div>
  )
}
