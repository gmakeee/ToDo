import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

export async function GET() {
  const db = createServiceClient()
  const today = new Date().toISOString().split('T')[0]

  const { data: cached } = await db
    .from('daily_motivation')
    .select('*')
    .eq('date', today)
    .single()

  if (cached) return NextResponse.json(cached)

  // Generate via OpenRouter
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'mistralai/mistral-7b-instruct',
      messages: [
        {
          role: 'user',
          content:
            'Напиши одну короткую мотивирующую цитату на русском языке для девушки, которая работает над своими привычками. Только текст цитаты, без кавычек и подписи. Максимум 2 предложения.',
        },
      ],
      max_tokens: 100,
    }),
  })

  const json = await res.json()
  const text = json.choices?.[0]?.message?.content?.trim() ?? 'Каждый день — это новый шанс стать лучше. Ты справишься! 💪'

  const { data: saved } = await db
    .from('daily_motivation')
    .insert({ date: today, text })
    .select()
    .single()

  return NextResponse.json(saved ?? { date: today, text })
}
