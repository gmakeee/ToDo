'use client'

import { useEffect, useState } from 'react'
import { MoodLog, MoodPeriod } from '@/types'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Check } from 'lucide-react'
import { format, subDays, eachDayOfInterval, isSameDay } from 'date-fns'
import { ru } from 'date-fns/locale'

interface Props {
  telegramId: number
  firstName?: string
  username?: string
}

const PERIODS: { id: MoodPeriod; label: string; icon: string; hours: string }[] = [
  { id: 'morning',   label: 'Утро',    icon: '🌅', hours: '06:00–12:00' },
  { id: 'afternoon', label: 'День',    icon: '☀️', hours: '12:00–18:00' },
  { id: 'evening',   label: 'Вечер',   icon: '🌙', hours: '18:00–00:00' },
]

const MOOD_EMOJIS = [
  { emoji: '😄', score: 5, label: 'Отлично' },
  { emoji: '🙂', score: 4, label: 'Хорошо' },
  { emoji: '😐', score: 3, label: 'Нейтрально' },
  { emoji: '😕', score: 2, label: 'Не очень' },
  { emoji: '😔', score: 1, label: 'Плохо' },
]

type StatsRange = '7' | '30'

function getCurrentPeriod(): MoodPeriod {
  const h = new Date().getHours()
  if (h >= 6 && h < 12) return 'morning'
  if (h >= 12 && h < 18) return 'afternoon'
  return 'evening'
}

export default function MoodView({ telegramId, firstName, username }: Props) {
  const [todayLogs, setTodayLogs] = useState<MoodLog[]>([])
  const [historyLogs, setHistoryLogs] = useState<MoodLog[]>([])
  const [activePeriod, setActivePeriod] = useState<MoodPeriod | null>(null)
  const [selectedEmoji, setSelectedEmoji] = useState('')
  const [selectedScore, setSelectedScore] = useState(0)
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [statsRange, setStatsRange] = useState<StatsRange>('7')

  useEffect(() => { loadToday(); loadHistory(statsRange) }, [])

  async function loadToday() {
    const res = await fetch(`/api/moods?telegram_id=${telegramId}&range=1`)
    const data = await res.json()
    setTodayLogs(data)
  }

  async function loadHistory(range: StatsRange) {
    const res = await fetch(`/api/moods?telegram_id=${telegramId}&range=${range}`)
    const data = await res.json()
    setHistoryLogs(data)
    setStatsRange(range)
  }

  function openPeriod(period: MoodPeriod) {
    const existing = todayLogs.find((l) => l.period === period)
    setActivePeriod(period)
    setSelectedEmoji(existing?.mood ?? '')
    setSelectedScore(existing?.mood_score ?? 0)
    setNote(existing?.note ?? '')
  }

  async function handleSave() {
    if (!selectedEmoji || !activePeriod) return
    setSaving(true)
    const res = await fetch('/api/moods', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        telegram_id: telegramId,
        first_name: firstName,
        username,
        period: activePeriod,
        mood: selectedEmoji,
        mood_score: selectedScore,
        note: note.trim() || null,
      }),
    })
    const data = await res.json()
    setTodayLogs((prev) => {
      const filtered = prev.filter((l) => l.period !== activePeriod)
      return [...filtered, data]
    })
    setHistoryLogs((prev) => {
      const filtered = prev.filter((l) => !(l.period === activePeriod && isSameDay(new Date(l.logged_at), new Date())))
      return [data, ...filtered]
    })
    setSaving(false)
    setActivePeriod(null)
  }

  const currentPeriod = getCurrentPeriod()
  const days = eachDayOfInterval({ start: subDays(new Date(), parseInt(statsRange) - 1), end: new Date() })

  // Average score per day
  const dayStats = days.map((day) => {
    const logs = historyLogs.filter((l) => isSameDay(new Date(l.logged_at), day) && l.mood_score)
    const avg = logs.length ? logs.reduce((s, l) => s + (l.mood_score ?? 0), 0) / logs.length : 0
    return { day, avg, logs }
  })

  const overallAvg = historyLogs.filter((l) => l.mood_score).length
    ? historyLogs.filter((l) => l.mood_score).reduce((s, l) => s + (l.mood_score ?? 0), 0) / historyLogs.filter((l) => l.mood_score).length
    : 0

  const dominantMood = (() => {
    const counts: Record<string, number> = {}
    historyLogs.forEach((l) => { counts[l.mood] = (counts[l.mood] ?? 0) + 1 })
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? ''
  })()

  const moodLabel = MOOD_EMOJIS.find((m) => m.score === Math.round(overallAvg))?.label ?? ''

  return (
    <div className="space-y-5">
      {/* Today's periods */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Сегодня</p>
        <div className="grid grid-cols-3 gap-2">
          {PERIODS.map((p) => {
            const log = todayLogs.find((l) => l.period === p.id)
            const isCurrent = p.id === currentPeriod
            return (
              <button
                key={p.id}
                onClick={() => openPeriod(p.id)}
                className={`p-3 rounded-2xl border flex flex-col items-center gap-2 transition-all active:scale-95 relative ${
                  log
                    ? 'bg-gradient-to-b from-purple-50 to-pink-50 border-purple-200 dark:from-purple-950/20 dark:to-pink-950/20 dark:border-purple-800/40'
                    : isCurrent
                    ? 'bg-purple-50 border-purple-200 dark:bg-purple-950/20 dark:border-purple-800/40 ring-2 ring-purple-300 ring-offset-1'
                    : 'bg-card border-border'
                }`}
              >
                {log && (
                  <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-purple-500 flex items-center justify-center">
                    <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                  </div>
                )}
                <span className="text-2xl">{log ? log.mood : p.icon}</span>
                <div className="text-center">
                  <p className="text-xs font-medium leading-tight">{p.label}</p>
                  <p className="text-[10px] text-muted-foreground">{log ? 'изменить' : p.hours}</p>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Stats */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Статистика</p>
          <div className="flex bg-muted rounded-xl p-0.5 gap-0.5">
            {(['7', '30'] as StatsRange[]).map((r) => (
              <button
                key={r}
                onClick={() => loadHistory(r)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                  statsRange === r ? 'bg-white dark:bg-zinc-800 shadow-sm text-foreground' : 'text-muted-foreground'
                }`}
              >
                {r} дней
              </button>
            ))}
          </div>
        </div>

        {/* Summary */}
        {historyLogs.length > 0 ? (
          <>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="p-4 rounded-2xl bg-purple-50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/30">
                <p className="text-3xl mb-1">{dominantMood}</p>
                <p className="text-xs font-medium">Чаще всего</p>
                <p className="text-xs text-muted-foreground">{moodLabel}</p>
              </div>
              <div className="p-4 rounded-2xl bg-pink-50 dark:bg-pink-950/20 border border-pink-100 dark:border-pink-900/30">
                <p className="text-2xl font-bold text-pink-600 mb-1">{overallAvg.toFixed(1)}</p>
                <p className="text-xs font-medium">Средний балл</p>
                <p className="text-xs text-muted-foreground">из 5</p>
              </div>
            </div>

            {/* Chart */}
            <div className="flex items-end gap-1 h-20">
              {dayStats.map(({ day, avg, logs }) => (
                <div key={day.toISOString()} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full flex items-end justify-center" style={{ height: '64px' }}>
                    {avg > 0 ? (
                      <div
                        className="w-full rounded-t-lg bg-gradient-to-t from-purple-400 to-pink-400 transition-all"
                        style={{ height: `${(avg / 5) * 100}%` }}
                      />
                    ) : (
                      <div className="w-full h-1 rounded-full bg-muted" />
                    )}
                  </div>
                  {parseInt(statsRange) <= 7 && (
                    <span className="text-[9px] text-muted-foreground">
                      {format(day, 'EEE', { locale: ru })}
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Recent entries */}
            <div className="mt-4 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Последние записи</p>
              {historyLogs.slice(0, 5).map((log) => (
                <div key={log.id} className="flex items-start gap-3 p-3 rounded-xl bg-muted/40">
                  <span className="text-2xl shrink-0">{log.mood}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium">
                        {PERIODS.find((p) => p.id === log.period)?.label}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(log.logged_at), 'd MMM', { locale: ru })}
                      </span>
                    </div>
                    {log.note && <p className="text-xs text-muted-foreground mt-0.5 truncate">{log.note}</p>}
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-8 text-muted-foreground text-sm">
            Пока нет записей. Отметь своё настроение выше!
          </div>
        )}
      </div>

      {/* Log mood dialog */}
      <Dialog open={activePeriod !== null} onOpenChange={(o) => !o && setActivePeriod(null)}>
        <DialogContent className="max-w-[calc(100vw-2rem)] rounded-3xl mx-auto">
          <DialogHeader>
            <DialogTitle className="text-center">
              {PERIODS.find((p) => p.id === activePeriod)?.icon}{' '}
              {PERIODS.find((p) => p.id === activePeriod)?.label}
            </DialogTitle>
            {todayLogs.find((l) => l.period === activePeriod) && (
              <p className="text-center text-xs text-purple-500 font-medium mt-1">Редактирование записи</p>
            )}
          </DialogHeader>
          <div className="space-y-5 pt-1">
            <div>
              <p className="text-sm text-center text-muted-foreground mb-3">Как ты себя чувствуешь?</p>
              <div className="flex justify-center gap-2">
                {MOOD_EMOJIS.map((m) => (
                  <button
                    key={m.emoji}
                    onClick={() => { setSelectedEmoji(m.emoji); setSelectedScore(m.score) }}
                    className={`w-12 h-12 text-3xl rounded-2xl flex items-center justify-center transition-all ${
                      selectedEmoji === m.emoji ? 'bg-purple-100 dark:bg-purple-900/50 scale-110 shadow-md' : 'hover:bg-muted'
                    }`}
                    title={m.label}
                  >
                    {m.emoji}
                  </button>
                ))}
              </div>
              {selectedEmoji && (
                <p className="text-center text-xs text-muted-foreground mt-2">
                  {MOOD_EMOJIS.find((m) => m.emoji === selectedEmoji)?.label}
                </p>
              )}
            </div>

            <Textarea
              placeholder="Как прошло? Что чувствуешь? (необязательно)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="resize-none rounded-2xl text-sm"
              rows={3}
            />

            <button
              onClick={handleSave}
              disabled={!selectedEmoji || saving}
              className="w-full h-12 rounded-2xl bg-purple-500 hover:bg-purple-600 disabled:opacity-40 active:scale-[0.98] text-white text-sm font-semibold transition-all shadow-lg shadow-purple-200 flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" strokeWidth={2.5} />
              {saving ? 'Сохраняем...' : 'Сохранить'}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
