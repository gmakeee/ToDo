'use client'

import { useState, useEffect } from 'react'
import { Habit } from '@/types'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface Props {
  habit: Habit | null
  open: boolean
  onClose: () => void
  onSave: (id: string, updates: Partial<Habit>) => Promise<void>
}

const EMOJIS = ['✨', '💪', '🧘', '📚', '💧', '🚶', '🌅', '📝', '🎯', '🏃', '🥗', '😴', '🎵', '🧹', '📞']

const FREQ_OPTIONS = [
  { value: 'daily',   label: 'Каждый день' },
  { value: 'weekly',  label: 'Каждую неделю' },
  { value: 'monthly', label: 'Каждый месяц' },
] as const

const TIMES_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 10]

export default function EditHabitSheet({ habit, open, onClose, onSave }: Props) {
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState('✨')
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly'>('daily')
  const [timesPerPeriod, setTimesPerPeriod] = useState(1)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (habit) {
      setName(habit.name)
      setEmoji(habit.emoji)
      setFrequency(habit.frequency)
      setTimesPerPeriod(habit.times_per_period)
    }
  }, [habit])

  async function handleSave() {
    if (!name.trim() || !habit) return
    setSaving(true)
    await onSave(habit.id, { name: name.trim(), emoji, frequency, times_per_period: timesPerPeriod })
    setSaving(false)
    onClose()
  }

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="bottom" className="rounded-t-3xl max-h-[88vh] overflow-y-auto px-5 pb-8">
        <SheetHeader className="pb-3 pt-1">
          <SheetTitle className="text-base">Редактировать привычку</SheetTitle>
        </SheetHeader>

        <div className="space-y-5">
          {/* Emoji */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2.5">Иконка</p>
            <div className="grid grid-cols-8 gap-1.5">
              {EMOJIS.map((e) => (
                <button
                  key={e}
                  onClick={() => setEmoji(e)}
                  className={`aspect-square rounded-xl text-xl flex items-center justify-center transition-all ${
                    emoji === e ? 'bg-pink-100 dark:bg-pink-900/50 ring-2 ring-pink-400 scale-105' : 'bg-muted hover:bg-muted/80'
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          {/* Name */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Название</p>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-11 rounded-xl text-sm"
            />
          </div>

          {/* Frequency */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Частота</p>
            <div className="flex gap-2">
              {FREQ_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setFrequency(opt.value)}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-medium transition-all ${
                    frequency === opt.value
                      ? 'bg-pink-500 text-white shadow-md shadow-pink-200'
                      : 'bg-muted text-muted-foreground hover:bg-muted/70'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Times per period */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">
              Раз в {frequency === 'daily' ? 'день' : frequency === 'weekly' ? 'неделю' : 'месяц'}
            </p>
            <div className="flex gap-2 flex-wrap">
              {TIMES_OPTIONS.map((n) => (
                <button
                  key={n}
                  onClick={() => setTimesPerPeriod(n)}
                  className={`w-10 h-10 rounded-xl text-sm font-semibold transition-all ${
                    timesPerPeriod === n
                      ? 'bg-pink-500 text-white shadow-md shadow-pink-200'
                      : 'bg-muted text-muted-foreground hover:bg-muted/70'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <Button
            onClick={handleSave}
            disabled={!name.trim() || saving}
            className="w-full h-12 rounded-2xl bg-pink-500 hover:bg-pink-600 text-white text-sm font-semibold shadow-lg shadow-pink-200"
          >
            {saving ? 'Сохраняем...' : 'Сохранить изменения'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
