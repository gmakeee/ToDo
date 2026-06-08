import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

export async function GET() {
  const db = createServiceClient()
  const { data } = await db.from('habit_templates').select('*').order('category')
  return NextResponse.json(data ?? [])
}
