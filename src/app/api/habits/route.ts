import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const telegramId = req.nextUrl.searchParams.get('telegram_id')
  if (!telegramId) return NextResponse.json({ error: 'Missing telegram_id' }, { status: 400 })

  const db = createServiceClient()

  const { data: user } = await db
    .from('users')
    .select('id')
    .eq('telegram_id', telegramId)
    .single()

  if (!user) return NextResponse.json([])

  const { data } = await db
    .from('habits')
    .select('*')
    .eq('user_id', user.id)
    .is('archived_at', null)
    .order('created_at', { ascending: true })

  return NextResponse.json(data ?? [])
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { telegram_id, name, emoji, frequency, times_per_period, remind_at, template_id } = body

  if (!telegram_id || !name) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  const db = createServiceClient()

  // Upsert user
  const { data: user } = await db
    .from('users')
    .upsert({ telegram_id, first_name: body.first_name, username: body.username }, { onConflict: 'telegram_id' })
    .select()
    .single()

  const { data: habit } = await db
    .from('habits')
    .insert({
      user_id: user!.id,
      name,
      emoji: emoji ?? '✨',
      frequency: frequency ?? 'daily',
      times_per_period: times_per_period ?? 1,
      remind_at: remind_at ?? [],
      template_id: template_id ?? null,
    })
    .select()
    .single()

  return NextResponse.json(habit)
}

export async function PATCH(req: NextRequest) {
  const body = await req.json()
  const { id, ...updates } = body
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const db = createServiceClient()
  const { data } = await db.from('habits').update(updates).eq('id', id).select().single()
  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const db = createServiceClient()
  await db.from('habits').update({ archived_at: new Date().toISOString() }).eq('id', id)
  return NextResponse.json({ ok: true })
}
