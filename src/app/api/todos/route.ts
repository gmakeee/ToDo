import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

async function getUser(db: ReturnType<typeof createServiceClient>, telegramId: string) {
  const { data } = await db.from('users').select('id').eq('telegram_id', telegramId).single()
  return data
}

export async function GET(req: NextRequest) {
  const telegramId = req.nextUrl.searchParams.get('telegram_id')
  if (!telegramId) return NextResponse.json({ error: 'Missing telegram_id' }, { status: 400 })

  const db = createServiceClient()
  const user = await getUser(db, telegramId)
  if (!user) return NextResponse.json([])

  const { data } = await db
    .from('todos')
    .select('*')
    .eq('user_id', user.id)
    .order('completed', { ascending: true })
    .order('deadline', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false })

  return NextResponse.json(data ?? [])
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { telegram_id, title, description, deadline } = body
  if (!telegram_id || !title) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  const db = createServiceClient()
  const user = await getUser(db, telegram_id)
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const { data } = await db
    .from('todos')
    .insert({ user_id: user.id, title, description: description || null, deadline: deadline || null })
    .select()
    .single()

  return NextResponse.json(data)
}

export async function PATCH(req: NextRequest) {
  const body = await req.json()
  const { id, ...updates } = body
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const db = createServiceClient()

  if (updates.completed === true) updates.completed_at = new Date().toISOString()
  if (updates.completed === false) updates.completed_at = null

  const { data } = await db.from('todos').update(updates).eq('id', id).select().single()
  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const db = createServiceClient()
  await db.from('todos').delete().eq('id', id)
  return NextResponse.json({ ok: true })
}
