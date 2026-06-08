'use client'

import { Habit } from '@/types'
import HabitCard from './HabitCard'

interface Props {
  habits: Habit[]
  completionCounts: Map<string, number>
  onComplete: (id: string, mood?: number, note?: string) => void
  onPause: (id: string, pausedUntil: string | null) => void
  onDelete: (id: string) => void
  onEdit: (habit: Habit) => void
}

export default function HabitList({ habits, completionCounts, onComplete, onPause, onDelete, onEdit }: Props) {
  const active = habits.filter((h) => !h.is_paused)
  const paused = habits.filter((h) => h.is_paused)

  if (habits.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
        <div className="text-5xl">🌱</div>
        <p className="text-sm text-muted-foreground">Привычек пока нет.<br />Нажми + чтобы добавить первую!</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {active.map((habit) => (
        <HabitCard
          key={habit.id}
          habit={habit}
          completedCount={completionCounts.get(habit.id) ?? 0}
          onComplete={onComplete}
          onPause={onPause}
          onDelete={onDelete}
          onEdit={onEdit}
        />
      ))}

      {paused.length > 0 && (
        <>
          <p className="text-xs text-muted-foreground pt-2">На паузе</p>
          {paused.map((habit) => (
            <HabitCard
              key={habit.id}
              habit={habit}
              completedCount={0}
              onComplete={onComplete}
              onPause={onPause}
              onDelete={onDelete}
              onEdit={onEdit}
            />
          ))}
        </>
      )}
    </div>
  )
}
