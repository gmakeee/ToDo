import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { checkAndGrantAchievements } from '@/lib/achievements'
import { startOfWeek, startOfMonth, startOfDay, subDays } from 'date-fns'

export async function GET(req: NextRequest) {
  const habitId = req.nextUrl.searchParams.get('habit_id')
  const telegramId = req.nextUrl.searchParams.get('telegram_id')
  const range = req.nextUrl.searchParams.get('range') ?? '30'

  if (!habitId && !telegramId) return NextResponse.json({ error: 'Missing params' }, { status: 400 })

  const db = createServiceClient()
  const since = subDays(new Date(), parseInt(range)).toISOString()

  let userId: string | null = null
  if (telegramId) {
    const { data: user } = await db.from('users').select('id').eq('telegram_id', telegramId).single()
    if (!user) return NextResponse.json([])
    userId = user.id
  }

  let query = db.from('completions').select('*').gte('completed_at', since).order('completed_at', { ascending: false })
  if (habitId) query = query.eq('habit_id', habitId)
  if (userId) query = query.eq('user_id', userId)

  const { data } = await query
  return NextResponse.json(data ?? [])
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { habit_id, telegram_id, mood, note } = body

  if (!habit_id || !telegram_id) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  const db = createServiceClient()

  const { data: user } = await db.from('users').select('id').eq('telegram_id', telegram_id).single()
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const { data: habit } = await db.from('habits').select('*').eq('id', habit_id).single()
  if (!habit) return NextResponse.json({ error: 'Habit not found' }, { status: 404 })

  const now = new Date()

  // Check if already completed enough times today/this week/this month
  let periodStart: Date
  if (habit.frequency === 'daily') periodStart = startOfDay(now)
  else if (habit.frequency === 'weekly') periodStart = startOfWeek(now, { weekStartsOn: 1 })
  else periodStart = startOfMonth(now)

  const { count } = await db
    .from('completions')
    .select('id', { count: 'exact', head: true })
    .eq('habit_id', habit_id)
    .gte('completed_at', periodStart.toISOString())

  if ((count ?? 0) >= habit.times_per_period) {
    return NextResponse.json({ error: 'Already completed for this period' }, { status: 400 })
  }

  const { data: completion } = await db
    .from('completions')
    .insert({ habit_id, user_id: user.id, mood: mood ?? null, note: note ?? null })
    .select()
    .single()

  // Update streak
  const yesterday = startOfDay(subDays(now, 1))
  const { count: yesterdayCount } = await db
    .from('completions')
    .select('id', { count: 'exact', head: true })
    .eq('habit_id', habit_id)
    .gte('completed_at', yesterday.toISOString())
    .lt('completed_at', startOfDay(now).toISOString())

  const newStreak = (yesterdayCount ?? 0) > 0 ? habit.streak + 1 : 1
  const longestStreak = Math.max(newStreak, habit.longest_streak)

  await db.from('habits').update({ streak: newStreak, longest_streak: longestStreak }).eq('id', habit_id)

  const newAchievements = await checkAndGrantAchievements(user.id, habit_id, newStreak)

  return NextResponse.json({ completion, streak: newStreak, new_achievements: newAchievements })
}
