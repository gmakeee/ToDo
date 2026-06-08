import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const telegramId = req.nextUrl.searchParams.get('telegram_id')
  if (!telegramId) return NextResponse.json({ error: 'Missing telegram_id' }, { status: 400 })

  const db = createServiceClient()
  const { data: user } = await db.from('users').select('id').eq('telegram_id', telegramId).single()
  if (!user) return NextResponse.json([])

  const { data } = await db
    .from('achievements')
    .select('*')
    .eq('user_id', user.id)
    .order('earned_at', { ascending: false })

  return NextResponse.json(data ?? [])
}
