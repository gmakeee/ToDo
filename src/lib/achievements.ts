import { AchievementType, ACHIEVEMENT_META } from '@/types'
import { createServiceClient } from './supabase'

async function addXp(db: ReturnType<typeof createServiceClient>, userId: string, xp: number) {
  const { data: user } = await db.from('users').select('xp').eq('id', userId).single()
  if (!user) return
  const newXp = (user.xp ?? 0) + xp
  const newLevel = Math.floor(Math.sqrt(newXp / 100)) + 1
  await db.from('users').update({ xp: newXp, level: newLevel }).eq('id', userId)
}

export async function checkAndGrantAchievements(userId: string, habitId: string, streak: number) {
  const db = createServiceClient()

  const streakMilestones: { streak: number; type: AchievementType }[] = [
    { streak: 3,   type: 'streak_3'   },
    { streak: 7,   type: 'streak_7'   },
    { streak: 14,  type: 'streak_14'  },
    { streak: 30,  type: 'streak_30'  },
    { streak: 100, type: 'streak_100' },
  ]

  const newAchievements: AchievementType[] = []

  for (const milestone of streakMilestones) {
    if (streak >= milestone.streak) {
      const { data: existing } = await db
        .from('achievements')
        .select('id')
        .eq('user_id', userId)
        .eq('habit_id', habitId)
        .eq('type', milestone.type)
        .maybeSingle()

      if (!existing) {
        const { error } = await db
          .from('achievements')
          .insert({ user_id: userId, habit_id: habitId, type: milestone.type })
        if (!error) {
          newAchievements.push(milestone.type)
          await addXp(db, userId, ACHIEVEMENT_META[milestone.type].xp)
        }
      }
    }
  }

  const { count } = await db
    .from('habits')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .is('archived_at', null)

  if (count === 1) await grantOnce(db, userId, null, 'first_habit', newAchievements)
  if (count !== null && count >= 5) await grantOnce(db, userId, null, 'five_habits', newAchievements)

  return newAchievements
}

async function grantOnce(
  db: ReturnType<typeof createServiceClient>,
  userId: string,
  habitId: string | null,
  type: AchievementType,
  collected: AchievementType[]
) {
  const { data: existing } = await db
    .from('achievements')
    .select('id')
    .eq('user_id', userId)
    .eq('type', type)
    .maybeSingle()

  if (!existing) {
    const { error } = await db
      .from('achievements')
      .insert({ user_id: userId, habit_id: habitId, type })
    if (!error) {
      collected.push(type)
      await addXp(db, userId, ACHIEVEMENT_META[type].xp)
    }
  }
}
