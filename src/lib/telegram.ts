export function getTelegramUser() {
  if (typeof window === 'undefined') return null
  const tg = (window as any).Telegram?.WebApp
  if (!tg?.initDataUnsafe?.user) return null
  return tg.initDataUnsafe.user as {
    id: number
    first_name: string
    last_name?: string
    username?: string
    language_code?: string
  }
}

export function getTelegramWebApp() {
  if (typeof window === 'undefined') return null
  return (window as any).Telegram?.WebApp ?? null
}

export function expandTelegramApp() {
  getTelegramWebApp()?.expand()
}
