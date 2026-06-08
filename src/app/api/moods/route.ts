import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { subDays } from 'date-fns'

async function getUser(db: ReturnType<typeof createServiceClient>, telegramId: string) {
  const { data } = await db.from('users').select('id').eq('telegram_id', telegramId).single()
  return data
}

export async function GET(req: NextRequest) {
  const telegramId = req.nextUrl.searchParams.get('telegram_id')
  const range = req.nextUrl.searchParams.get('range') ?? '30'
  if (!telegramId) return NextResponse.json({ error: 'Missing telegram_id' }, { status: 400 })

  const db = createServiceClient()
  const user = await getUser(db, telegramId)
  if (!user) return NextResponse.json([])

  const since = subDays(new Date(), parseInt(range)).toISOString()
  const { data } = await db
    .from('mood_logs')
    .select('*')
    .eq('user_id', user.id)
    .gte('logged_at', since)
    .order('logged_at', { ascending: false })

  return NextResponse.json(data ?? [])
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { telegram_id, period, mood, mood_score, note } = body
  if (!telegram_id || !period || !mood) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  const db = createServiceClient()

  const { data: user } = await db
    .from('users')
    .upsert({ telegram_id, first_name: body.first_name, username: body.username }, { onConflict: 'telegram_id' })
    .select('id')
    .single()

  if (!user) return NextResponse.json({ error: 'User error' }, { status: 500 })

  const today = new Date().toISOString().split('T')[0]

  // Upsert by (user_id, period, log_date)
  const { data: existing } = await db
    .from('mood_logs')
    .select('id')
    .eq('user_id', user.id)
    .eq('period', period)
    .eq('log_date', today)
    .single()

  let result
  if (existing) {
    const { data } = await db
      .from('mood_logs')
      .update({ mood, mood_score: mood_score ?? null, note: note ?? null, logged_at: new Date().toISOString() })
      .eq('id', existing.id)
      .select()
      .single()
    result = data
  } else {
    const { data } = await db
      .from('mood_logs')
      .insert({ user_id: user.id, period, mood, mood_score: mood_score ?? null, note: note ?? null, log_date: today })
      .select()
      .single()
    result = data
  }

  return NextResponse.json(result)
}
