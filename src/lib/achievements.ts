import { AchievementType, ACHIEVEMENT_META } from '@/types'
import { createServiceClient } from './supabase'

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
        .single()

      if (!existing) {
        await db.from('achievements').insert({ user_id: userId, habit_id: habitId, type: milestone.type })
        newAchievements.push(milestone.type)
        const xp = ACHIEVEMENT_META[milestone.type].xp
        await db.rpc('increment_user_xp', { p_user_id: userId, p_xp: xp })
      }
    }
  }

  // Check habit count
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
    .single()

  if (!existing) {
    await db.from('achievements').insert({ user_id: userId, habit_id: habitId, type })
    collected.push(type)
    await db.rpc('increment_user_xp', { p_user_id: userId, p_xp: ACHIEVEMENT_META[type].xp })
  }
}
