'use client'

import { useState } from 'react'
import { Habit, HabitTemplate } from '@/types'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Plus, Sparkles } from 'lucide-react'
import { useEffect } from 'react'

interface Props {
  onAdd: (habit: Partial<Habit>) => Promise<void>
}

const EMOJIS = ['✨', '💪', '🧘', '📚', '💧', '🚶', '🌅', '📝', '🎯', '🏃', '🥗', '😴', '🎵', '🧹', '📞']

export default function AddHabitSheet({ onAdd }: Props) {
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<'custom' | 'templates'>('custom')
  const [templates, setTemplates] = useState<HabitTemplate[]>([])
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState('✨')
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly'>('daily')
  const [timesPerPeriod, setTimesPerPeriod] = useState(1)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open && templates.length === 0) {
      fetch('/api/templates').then((r) => r.json()).then(setTemplates)
    }
  }, [open])

  async function handleSubmit() {
    if (!name.trim()) return
    setLoading(true)
    await onAdd({ name: name.trim(), emoji, frequency, times_per_period: timesPerPeriod })
    setName('')
    setEmoji('✨')
    setFrequency('daily')
    setTimesPerPeriod(1)
    setLoading(false)
    setOpen(false)
  }

  async function handleTemplate(t: HabitTemplate) {
    setLoading(true)
    await onAdd({
      name: t.name,
      emoji: t.emoji,
      frequency: t.frequency,
      times_per_period: t.times_per_period,
      template_id: t.id,
    })
    setLoading(false)
    setOpen(false)
  }

  const categories = [...new Set(templates.map((t) => t.category))]

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger className="inline-flex items-center justify-center rounded-full bg-pink-500 hover:bg-pink-600 text-white w-10 h-10 transition-colors">
        <Plus className="w-5 h-5" />
      </SheetTrigger>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[85vh] overflow-y-auto">
        <SheetHeader className="pb-4">
          <SheetTitle>Новая привычка</SheetTitle>
        </SheetHeader>

        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setTab('custom')}
            className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${tab === 'custom' ? 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300' : 'text-muted-foreground'}`}
          >
            Своя
          </button>
          <button
            onClick={() => setTab('templates')}
            className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-1 ${tab === 'templates' ? 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300' : 'text-muted-foreground'}`}
          >
            <Sparkles className="w-3.5 h-3.5" /> Шаблоны
          </button>
        </div>

        {tab === 'custom' ? (
          <div className="space-y-4">
            <div>
              <p className="text-xs text-muted-foreground mb-2">Эмодзи</p>
              <div className="flex flex-wrap gap-2">
                {EMOJIS.map((e) => (
                  <button
                    key={e}
                    onClick={() => setEmoji(e)}
                    className={`w-9 h-9 rounded-xl text-lg transition-all ${emoji === e ? 'bg-pink-100 dark:bg-pink-900/40 scale-110' : 'hover:bg-muted'}`}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>

            <Input
              placeholder="Название привычки..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="text-sm"
            />

            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-muted-foreground mb-1.5">Частота</p>
                <Select value={frequency} onValueChange={(v) => setFrequency(v as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Ежедневно</SelectItem>
                    <SelectItem value="weekly">Еженедельно</SelectItem>
                    <SelectItem value="monthly">Ежемесячно</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1.5">Раз в период</p>
                <Select value={String(timesPerPeriod)} onValueChange={(v) => setTimesPerPeriod(Number(v))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 10].map((n) => (
                      <SelectItem key={n} value={String(n)}>{n}x</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={!name.trim() || loading}
              className="w-full bg-pink-500 hover:bg-pink-600 text-white"
            >
              Добавить привычку
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {categories.map((cat) => (
              <div key={cat}>
                <p className="text-xs font-medium text-muted-foreground mb-2">{cat}</p>
                <div className="space-y-2">
                  {templates.filter((t) => t.category === cat).map((t) => (
                    <button
                      key={t.id}
                      onClick={() => handleTemplate(t)}
                      disabled={loading}
                      className="w-full text-left p-3 rounded-xl border hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{t.emoji}</span>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{t.name}</p>
                          {t.description && <p className="text-xs text-muted-foreground">{t.description}</p>}
                        </div>
                        <Badge variant="secondary" className="text-xs shrink-0">
                          {t.times_per_period}x/{t.frequency === 'daily' ? 'день' : t.frequency === 'weekly' ? 'нед' : 'мес'}
                        </Badge>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
