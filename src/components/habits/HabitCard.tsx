'use client'

import { useState } from 'react'
import { Habit } from '@/types'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Check, Pause, Play, Trash2, ChevronRight } from 'lucide-react'
import { format, addDays } from 'date-fns'
import { ru } from 'date-fns/locale'

interface Props {
  habit: Habit
  completed: boolean
  onComplete: (id: string, mood?: number, note?: string) => void
  onPause: (id: string, pausedUntil: string | null) => void
  onDelete: (id: string) => void
}

const MOOD_LABELS = ['😔', '😕', '😐', '🙂', '😄']
const FREQ_LABELS: Record<string, string> = {
  daily: 'Ежедневно',
  weekly: 'Еженедельно',
  monthly: 'Ежемесячно',
}

export default function HabitCard({ habit, completed, onComplete, onPause, onDelete }: Props) {
  const [showComplete, setShowComplete] = useState(false)
  const [showPause, setShowPause] = useState(false)
  const [mood, setMood] = useState<number | undefined>()
  const [note, setNote] = useState('')

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
      <Card className={`p-4 transition-all ${habit.is_paused ? 'opacity-60' : ''} ${completed ? 'border-green-200 bg-green-50/50 dark:border-green-900/40 dark:bg-green-950/10' : ''}`}>
        <div className="flex items-center gap-3">
          <button
            onClick={() => !completed && !habit.is_paused && setShowComplete(true)}
            className={`w-10 h-10 rounded-full flex items-center justify-center text-xl shrink-0 transition-all ${
              completed
                ? 'bg-green-100 dark:bg-green-900/30'
                : habit.is_paused
                ? 'bg-gray-100 dark:bg-gray-800 cursor-default'
                : 'bg-pink-50 dark:bg-pink-950/30 hover:bg-pink-100 active:scale-95'
            }`}
          >
            {completed ? <Check className="w-5 h-5 text-green-500" /> : habit.emoji}
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm truncate">{habit.name}</span>
              {habit.is_paused && <Badge variant="secondary" className="text-xs shrink-0">Пауза</Badge>}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-muted-foreground">{FREQ_LABELS[habit.frequency]}</span>
              {habit.streak > 0 && (
                <span className="text-xs text-orange-500 font-medium">🔥 {habit.streak}</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1">
            {habit.is_paused ? (
              <Button size="icon" variant="ghost" className="w-8 h-8" onClick={() => onPause(habit.id, null)}>
                <Play className="w-4 h-4" />
              </Button>
            ) : (
              <Button size="icon" variant="ghost" className="w-8 h-8" onClick={() => setShowPause(true)}>
                <Pause className="w-4 h-4" />
              </Button>
            )}
            <Button size="icon" variant="ghost" className="w-8 h-8 text-destructive" onClick={() => onDelete(habit.id)}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Complete dialog with mood + note */}
      <Dialog open={showComplete} onOpenChange={setShowComplete}>
        <DialogContent className="max-w-sm mx-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {habit.emoji} {habit.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Как себя чувствуешь?</p>
              <div className="flex gap-2 justify-center">
                {MOOD_LABELS.map((label, i) => (
                  <button
                    key={i}
                    onClick={() => setMood(i + 1)}
                    className={`text-2xl p-2 rounded-xl transition-all ${mood === i + 1 ? 'bg-pink-100 dark:bg-pink-900/40 scale-110' : 'hover:bg-muted'}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Textarea
                placeholder="Заметка (необязательно)..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="resize-none text-sm"
                rows={2}
              />
            </div>
            <Button onClick={handleComplete} className="w-full bg-pink-500 hover:bg-pink-600 text-white">
              <Check className="w-4 h-4 mr-2" />
              Отметить выполненным
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Pause dialog */}
      <Dialog open={showPause} onOpenChange={setShowPause}>
        <DialogContent className="max-w-sm mx-4">
          <DialogHeader>
            <DialogTitle>Поставить на паузу</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {[1, 3, 7, 14].map((days) => (
              <Button
                key={days}
                variant="outline"
                className="w-full justify-between"
                onClick={() => handlePause(days)}
              >
                <span>На {days} {days === 1 ? 'день' : days < 5 ? 'дня' : 'дней'}</span>
                <span className="text-muted-foreground text-xs">
                  до {format(addDays(new Date(), days), 'd MMM', { locale: ru })}
                </span>
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
