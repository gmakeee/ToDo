import { NextRequest, NextResponse } from 'next/server'
import { Telegraf, Markup } from 'telegraf'
import { createServiceClient } from '@/lib/supabase'

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!)

const appUrl = process.env.NEXT_PUBLIC_APP_URL!
const botUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME!

bot.start(async (ctx) => {
  const user = ctx.from
  if (!user) return

  const db = createServiceClient()
  await db.from('users').upsert(
    {
      telegram_id: user.id,
      first_name: user.first_name,
      username: user.username ?? null,
    },
    { onConflict: 'telegram_id' }
  )

  await ctx.reply(
    `Привет, ${user.first_name}! 👋\n\nЯ помогу тебе отслеживать привычки и достигать целей. Открой приложение, чтобы начать!`,
    Markup.inlineKeyboard([
      Markup.button.webApp('🌸 Открыть трекер', appUrl),
    ])
  )
})

bot.command('stats', async (ctx) => {
  const db = createServiceClient()
  const { data: user } = await db
    .from('users')
    .select('id, level, xp, first_name')
    .eq('telegram_id', ctx.from.id)
    .single()

  if (!user) {
    return ctx.reply('Сначала запусти бот командой /start')
  }

  const { count: total } = await db
    .from('completions')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)

  const { data: habits } = await db
    .from('habits')
    .select('streak, name')
    .eq('user_id', user.id)
    .is('archived_at', null)
    .order('streak', { ascending: false })

  const topHabit = habits?.[0]

  await ctx.reply(
    `📊 Твоя статистика:\n\n` +
    `🏅 Уровень: ${user.level}\n` +
    `⚡ XP: ${user.xp}\n` +
    `✅ Всего выполнений: ${total ?? 0}\n` +
    (topHabit ? `🔥 Лучший стрик: ${topHabit.streak} дней (${topHabit.name})\n` : '') +
    `\nОткрой приложение для подробной статистики 👇`,
    Markup.inlineKeyboard([Markup.button.webApp('📱 Открыть', appUrl)])
  )
})

bot.command('habits', async (ctx) => {
  await ctx.reply(
    'Открой трекер, чтобы управлять своими привычками:',
    Markup.inlineKeyboard([Markup.button.webApp('🌸 Открыть трекер', appUrl)])
  )
})

export async function POST(req: NextRequest) {
  const body = await req.json()
  await bot.handleUpdate(body)
  return NextResponse.json({ ok: true })
}

export async function GET() {
  const webhookUrl = `${appUrl}/api/bot`
  await bot.telegram.setWebhook(webhookUrl)
  return NextResponse.json({ ok: true, webhook: webhookUrl })
}
