'use client'

import { useState } from 'react'
import { Habit } from '@/types'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Check, Pause, Play, Trash2, Pencil } from 'lucide-react'
import { format, addDays } from 'date-fns'
import { ru } from 'date-fns/locale'

interface Props {
  habit: Habit
  completedCount: number
  onComplete: (id: string, mood?: number, note?: string) => void
  onPause: (id: string, pausedUntil: string | null) => void
  onDelete: (id: string) => void
  onEdit: (habit: Habit) => void
}

const MOOD_LABELS = ['😔', '😕', '😐', '🙂', '😄']
const FREQ_LABELS: Record<string, string> = {
  daily: 'в день',
  weekly: 'в неделю',
  monthly: 'в месяц',
}

export default function HabitCard({ habit, completedCount, onComplete, onPause, onDelete, onEdit }: Props) {
  const [showComplete, setShowComplete] = useState(false)
  const [showPause, setShowPause] = useState(false)
  const [mood, setMood] = useState<number | undefined>()
  const [note, setNote] = useState('')

  const total = habit.times_per_period
  const done = Math.min(completedCount, total)
  const fullyDone = done >= total
  const isMulti = total > 1

  function handleComplete() {
    onComplete(habit.id, mood, note || undefined)
    setShowComplete(false)
    setMood(undefined)
    setNote('')
  }

  function handlePause(days: number) {
    const until = format(addDays(new Date(), days), 'yyyy-MM-dd')
    onPause(habit.id, until)
    setShowPause(false)
  }

  return (
    <>
      <div
        className={`rounded-2xl border transition-all ${
          habit.is_paused
            ? 'opacity-50 bg-muted/30 border-border'
            : fullyDone
            ? 'bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200 dark:from-emerald-950/20 dark:to-teal-950/20 dark:border-emerald-800/40'
            : done > 0
            ? 'bg-gradient-to-r from-pink-50/60 to-purple-50/60 border-pink-200/60 dark:from-pink-950/10 dark:to-purple-950/10 dark:border-pink-800/30'
            : 'bg-card border-border'
        }`}
      >
        <div className="flex items-center gap-3 p-4">
          {/* Check / progress button */}
          <button
            onClick={() => !fullyDone && !habit.is_paused && setShowComplete(true)}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-all active:scale-90 relative ${
              fullyDone
                ? 'bg-emerald-100 dark:bg-emerald-900/30 cursor-default'
                : habit.is_paused
                ? 'bg-muted cursor-default'
                : 'bg-pink-50 dark:bg-pink-950/30 hover:bg-pink-100 shadow-sm'
            }`}
          >
            {fullyDone ? (
              <Check className="w-6 h-6 text-emerald-500" strokeWidth={2.5} />
            ) : isMulti && done > 0 ? (
              <span className="text-lg font-bold text-pink-500">{done}</span>
            ) : (
              <span className="text-2xl">{habit.emoji}</span>
            )}
          </button>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm leading-tight truncate">{habit.name}</p>

            <div className="flex items-center gap-2 mt-1">
              {/* Progress dots for multi-completion habits */}
              {isMulti ? (
                <div className="flex items-center gap-1">
                  {Array.from({ length: total }).map((_, i) => (
                    <div
                      key={i}
                      className={`rounded-full transition-all ${
                        i < done
                          ? fullyDone
                            ? 'w-2 h-2 bg-emerald-400'
                            : 'w-2 h-2 bg-pink-400'
                          : 'w-2 h-2 bg-muted-foreground/20'
                      }`}
                    />
                  ))}
                  <span className="text-xs text-muted-foreground ml-1">
                    {done}/{total} {FREQ_LABELS[habit.frequency]}
                  </span>
                </div>
              ) : (
                <span className="text-xs text-muted-foreground">
                  {FREQ_LABELS[habit.frequency]}
                </span>
              )}

              {habit.streak > 1 && (
                <span className="text-xs font-semibold text-orange-500">🔥 {habit.streak}</span>
              )}
              {habit.is_paused && (
                <Badge variant="secondary" className="text-xs py-0 h-4">пауза</Badge>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => onEdit(habit)}
              className="w-8 h-8 flex items-center justify-center rounded-xl text-muted-foreground hover:bg-muted transition-colors"
            >
              <Pencil className="w-4 h-4" />
            </button>
            {habit.is_paused ? (
              <button
                onClick={() => onPause(habit.id, null)}
                className="w-8 h-8 flex items-center justify-center rounded-xl text-muted-foreground hover:bg-muted transition-colors"
              >
                <Play className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => setShowPause(true)}
                className="w-8 h-8 flex items-center justify-center rounded-xl text-muted-foreground hover:bg-muted transition-colors"
              >
                <Pause className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => onDelete(habit.id)}
              className="w-8 h-8 flex items-center justify-center rounded-xl text-muted-foreground hover:bg-red-50 hover:text-red-400 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Complete dialog */}
      <Dialog open={showComplete} onOpenChange={setShowComplete}>
        <DialogContent className="max-w-[calc(100vw-2rem)] rounded-3xl mx-auto">
          <DialogHeader>
            <DialogTitle className="text-center text-base">
              {habit.emoji} {habit.name}
            </DialogTitle>
            {isMulti && (
              <p className="text-center text-sm text-muted-foreground">
                Выполнение {done + 1} из {total}
              </p>
            )}
          </DialogHeader>
          <div className="space-y-5 pt-1">
            <div>
              <p className="text-sm text-center text-muted-foreground mb-3">Как себя чувствуешь?</p>
              <div className="flex gap-2 justify-center">
                {MOOD_LABELS.map((label, i) => (
                  <button
                    key={i}
                    onClick={() => setMood(i + 1)}
                    className={`text-3xl w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                      mood === i + 1 ? 'bg-pink-100 dark:bg-pink-900/50 scale-110 shadow-md' : 'hover:bg-muted'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <Textarea
              placeholder="Заметка — как прошло? (необязательно)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="resize-none text-sm rounded-2xl"
              rows={2}
            />

            <button
              onClick={handleComplete}
              className="w-full h-12 rounded-2xl bg-pink-500 hover:bg-pink-600 active:scale-[0.98] text-white text-sm font-semibold transition-all shadow-lg shadow-pink-200 flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" strokeWidth={2.5} />
              {isMulti ? `Отметить (${done + 1}/${total})` : 'Выполнено!'}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Pause dialog */}
      <Dialog open={showPause} onOpenChange={setShowPause}>
        <DialogContent className="max-w-[calc(100vw-2rem)] rounded-3xl mx-auto">
          <DialogHeader>
            <DialogTitle className="text-base">На сколько поставить паузу?</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-2 pt-1">
            {[1, 3, 7, 14].map((days) => (
              <button
                key={days}
                onClick={() => handlePause(days)}
                className="p-3.5 rounded-2xl border border-border bg-card hover:bg-muted active:scale-95 transition-all text-left"
              >
                <p className="text-sm font-semibold">{days} {days === 1 ? 'день' : days < 5 ? 'дня' : 'дней'}</p>
                <p className="text-xs text-muted-foreground">
                  до {format(addDays(new Date(), days), 'd MMM', { locale: ru })}
                </p>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
