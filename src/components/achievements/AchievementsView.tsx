'use client'

import { useEffect, useState } from 'react'
import { Achievement, ACHIEVEMENT_META, AchievementType } from '@/types'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'

interface Props {
  telegramId: number
}

const ALL_ACHIEVEMENTS = Object.keys(ACHIEVEMENT_META) as AchievementType[]

export default function AchievementsView({ telegramId }: Props) {
  const [earned, setEarned] = useState<Achievement[]>([])

  useEffect(() => {
    fetch(`/api/achievements?telegram_id=${telegramId}`)
      .then((r) => r.json())
      .then(setEarned)
  }, [])

  const earnedTypes = new Set(earned.map((a) => a.type))

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        {earned.length} из {ALL_ACHIEVEMENTS.length} разблокировано
      </p>
      <div className="grid grid-cols-2 gap-3">
        {ALL_ACHIEVEMENTS.map((type) => {
          const meta = ACHIEVEMENT_META[type]
          const isEarned = earnedTypes.has(type)
          const earnedEntry = earned.find((a) => a.type === type)

          return (
            <div
              key={type}
              className={`p-4 rounded-2xl border transition-all ${
                isEarned
                  ? 'bg-gradient-to-br from-pink-50 to-purple-50 dark:from-pink-950/20 dark:to-purple-950/20 border-pink-200 dark:border-pink-800/40'
                  : 'bg-muted/30 border-transparent opacity-50 grayscale'
              }`}
            >
              <div className="text-3xl mb-2">{meta.emoji}</div>
              <p className="text-sm font-semibold leading-tight">{meta.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{meta.desc}</p>
              <div className="flex items-center justify-between mt-2">
                <Badge variant="secondary" className="text-xs">+{meta.xp} XP</Badge>
                {isEarned && earnedEntry && (
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(earnedEntry.earned_at), 'd MMM', { locale: ru })}
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
