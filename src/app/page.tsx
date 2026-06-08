'use client'

import { useEffect, useState } from 'react'
import { getTelegramUser, expandTelegramApp } from '@/lib/telegram'
import { Habit, DailyMotivation } from '@/types'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import HabitList from '@/components/habits/HabitList'
import StatsView from '@/components/stats/StatsView'
import AchievementsView from '@/components/achievements/AchievementsView'
import AddHabitSheet from '@/components/habits/AddHabitSheet'
import { Sparkles, BarChart3, Trophy, Home } from 'lucide-react'

export default function App() {
  const [habits, setHabits] = useState<Habit[]>([])
  const [motivation, setMotivation] = useState<DailyMotivation | null>(null)
  const [completedToday, setCompletedToday] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('home')

  const tgUser = getTelegramUser()
  const telegramId = tgUser?.id

  useEffect(() => {
    expandTelegramApp()
    if (telegramId) {
      loadHabits()
      loadMotivation()
      loadTodayCompletions()
    } else {
      setLoading(false)
    }
  }, [])

  async function loadHabits() {
    const res = await fetch(`/api/habits?telegram_id=${telegramId}`)
    const data = await res.json()
    setHabits(data)
    setLoading(false)
  }

  async function loadMotivation() {
    const res = await fetch('/api/motivation')
    const data = await res.json()
    setMotivation(data)
  }

  async function loadTodayCompletions() {
    const res = await fetch(`/api/completions?user_id=_&telegram_id=${telegramId}&range=1`)
    const data: { habit_id: string }[] = await res.json()
    setCompletedToday(new Set(data.map((c) => c.habit_id)))
    setLoading(false)
  }

  async function handleComplete(habitId: string, mood?: number, note?: string) {
    const res = await fetch('/api/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ habit_id: habitId, telegram_id: telegramId, mood, note }),
    })
    if (res.ok) {
      const data = await res.json()
      setCompletedToday((prev) => new Set([...prev, habitId]))
      setHabits((prev) =>
        prev.map((h) => (h.id === habitId ? { ...h, streak: data.streak } : h))
      )
    }
  }

  async function handleAddHabit(habit: Partial<Habit>) {
    await fetch('/api/habits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...habit,
        telegram_id: telegramId,
        first_name: tgUser?.first_name,
        username: tgUser?.username,
      }),
    })
    await loadHabits()
  }

  async function handlePauseHabit(habitId: string, pausedUntil: string | null) {
    await fetch('/api/habits', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: habitId, is_paused: !!pausedUntil, paused_until: pausedUntil }),
    })
    await loadHabits()
  }

  async function handleDeleteHabit(habitId: string) {
    await fetch(`/api/habits?id=${habitId}`, { method: 'DELETE' })
    await loadHabits()
  }

  const activeHabits = habits.filter((h) => !h.is_paused)
  const todayProgress = activeHabits.length
    ? Math.round((completedToday.size / activeHabits.length) * 100)
    : 0

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-4xl animate-bounce">🌸</div>
      </div>
    )
  }

  if (!telegramId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center gap-4">
        <div className="text-5xl">🌸</div>
        <h1 className="text-xl font-semibold">Открой через Telegram</h1>
        <p className="text-sm text-muted-foreground">Это приложение работает только внутри Telegram Mini App</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-background max-w-md mx-auto">
      {/* Header */}
      <div className="px-4 pt-6 pb-4 bg-gradient-to-br from-pink-50 to-purple-50 dark:from-pink-950/20 dark:to-purple-950/20">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-lg font-semibold">Привет, {tgUser?.first_name} 🌸</h1>
            <p className="text-sm text-muted-foreground">
              {new Date().toLocaleDateString('ru', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
          <AddHabitSheet onAdd={handleAddHabit} />
        </div>

        {activeHabits.length > 0 && (
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Прогресс дня</span>
              <span>{completedToday.size}/{activeHabits.length}</span>
            </div>
            <Progress value={todayProgress} className="h-2" />
          </div>
        )}

        {motivation && (
          <div className="mt-3 p-3 rounded-xl bg-white/60 dark:bg-white/5 border border-pink-100 dark:border-pink-900/30">
            <div className="flex gap-2 items-start">
              <Sparkles className="w-4 h-4 text-pink-400 mt-0.5 shrink-0" />
              <p className="text-xs text-foreground/80 leading-relaxed">{motivation.text}</p>
            </div>
          </div>
        )}
      </div>

      <Tabs value={tab} onValueChange={setTab} className="flex-1 flex flex-col">
        <TabsContent value="home" className="flex-1 overflow-y-auto px-4 py-3 m-0">
          <HabitList
            habits={habits}
            completedToday={completedToday}
            onComplete={handleComplete}
            onPause={handlePauseHabit}
            onDelete={handleDeleteHabit}
          />
        </TabsContent>
        <TabsContent value="stats" className="flex-1 overflow-y-auto px-4 py-3 m-0">
          <StatsView telegramId={telegramId} />
        </TabsContent>
        <TabsContent value="achievements" className="flex-1 overflow-y-auto px-4 py-3 m-0">
          <AchievementsView telegramId={telegramId} />
        </TabsContent>

        <TabsList className="grid grid-cols-3 h-16 rounded-none border-t bg-background px-2 pb-2 mt-auto">
          <TabsTrigger value="home" className="flex flex-col gap-1 h-full data-[state=active]:text-pink-500">
            <Home className="w-5 h-5" />
            <span className="text-xs">Главная</span>
          </TabsTrigger>
          <TabsTrigger value="stats" className="flex flex-col gap-1 h-full data-[state=active]:text-pink-500">
            <BarChart3 className="w-5 h-5" />
            <span className="text-xs">Статистика</span>
          </TabsTrigger>
          <TabsTrigger value="achievements" className="flex flex-col gap-1 h-full data-[state=active]:text-pink-500">
            <Trophy className="w-5 h-5" />
            <span className="text-xs">Ачивки</span>
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  )
}
