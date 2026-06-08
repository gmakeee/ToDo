'use client'

import { useState, useEffect } from 'react'
import { Habit, HabitTemplate } from '@/types'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Plus, Sparkles } from 'lucide-react'

interface Props {
  onAdd: (habit: Partial<Habit>) => Promise<void>
}

const EMOJIS = ['✨', '💪', '🧘', '📚', '💧', '🚶', '🌅', '📝', '🎯', '🏃', '🥗', '😴', '🎵', '🧹', '📞']

const FREQ_OPTIONS = [
  { value: 'daily',   label: 'Каждый день' },
  { value: 'weekly',  label: 'Каждую неделю' },
  { value: 'monthly', label: 'Каждый месяц' },
] as const

const TIMES_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 10]

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
    setName(''); setEmoji('✨'); setFrequency('daily'); setTimesPerPeriod(1)
    setLoading(false); setOpen(false)
  }

  async function handleTemplate(t: HabitTemplate) {
    setLoading(true)
    await onAdd({ name: t.name, emoji: t.emoji, frequency: t.frequency, times_per_period: t.times_per_period, template_id: t.id })
    setLoading(false); setOpen(false)
  }

  const categories = [...new Set(templates.map((t) => t.category))]

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger className="inline-flex items-center justify-center rounded-full bg-pink-500 hover:bg-pink-600 active:scale-95 text-white w-11 h-11 transition-all shadow-lg shadow-pink-200">
        <Plus className="w-5 h-5" strokeWidth={2.5} />
      </SheetTrigger>

      <SheetContent side="bottom" className="rounded-t-3xl max-h-[88vh] overflow-y-auto px-5 pb-8">
        <SheetHeader className="pb-3 pt-1">
          <SheetTitle className="text-base">Новая привычка</SheetTitle>
        </SheetHeader>

        {/* Tab switcher */}
        <div className="flex bg-muted rounded-2xl p-1 mb-5">
          <button
            onClick={() => setTab('custom')}
            className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${tab === 'custom' ? 'bg-white dark:bg-zinc-800 shadow-sm text-foreground' : 'text-muted-foreground'}`}
          >
            Своя
          </button>
          <button
            onClick={() => setTab('templates')}
            className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-1.5 ${tab === 'templates' ? 'bg-white dark:bg-zinc-800 shadow-sm text-foreground' : 'text-muted-foreground'}`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Шаблоны
          </button>
        </div>

        {tab === 'custom' ? (
          <div className="space-y-5">
            {/* Emoji picker */}
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2.5">Иконка</p>
              <div className="grid grid-cols-8 gap-1.5">
                {EMOJIS.map((e) => (
                  <button
                    key={e}
                    onClick={() => setEmoji(e)}
                    className={`aspect-square rounded-xl text-xl flex items-center justify-center transition-all ${
                      emoji === e
                        ? 'bg-pink-100 dark:bg-pink-900/50 ring-2 ring-pink-400 scale-105'
                        : 'bg-muted hover:bg-muted/80'
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
                placeholder="Например: утренняя пробежка"
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
                Сколько раз в {frequency === 'daily' ? 'день' : frequency === 'weekly' ? 'неделю' : 'месяц'}
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
              onClick={handleSubmit}
              disabled={!name.trim() || loading}
              className="w-full h-12 rounded-2xl bg-pink-500 hover:bg-pink-600 text-white text-sm font-semibold shadow-lg shadow-pink-200"
            >
              {loading ? 'Добавляем...' : 'Добавить привычку'}
            </Button>
          </div>
        ) : (
          <div className="space-y-5">
            {categories.map((cat) => (
              <div key={cat}>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">{cat}</p>
                <div className="space-y-2">
                  {templates.filter((t) => t.category === cat).map((t) => (
                    <button
                      key={t.id}
                      onClick={() => handleTemplate(t)}
                      disabled={loading}
                      className="w-full text-left p-3.5 rounded-2xl border border-border bg-card hover:bg-muted/50 active:scale-[0.98] transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl w-10 h-10 flex items-center justify-center bg-muted rounded-xl shrink-0">
                          {t.emoji}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{t.name}</p>
                          {t.description && (
                            <p className="text-xs text-muted-foreground truncate">{t.description}</p>
                          )}
                        </div>
                        <Badge variant="secondary" className="text-xs shrink-0 rounded-lg">
                          {t.times_per_period}×/{t.frequency === 'daily' ? 'день' : t.frequency === 'weekly' ? 'нед' : 'мес'}
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
