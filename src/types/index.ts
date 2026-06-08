export type Frequency = 'daily' | 'weekly' | 'monthly'

export interface User {
  id: string
  telegram_id: number
  username?: string
  first_name?: string
  level: number
  xp: number
  timezone: string
  created_at: string
}

export interface HabitTemplate {
  id: string
  name: string
  emoji: string
  category: string
  frequency: Frequency
  times_per_period: number
  description?: string
}

export interface Habit {
  id: string
  user_id: string
  template_id?: string
  name: string
  emoji: string
  frequency: Frequency
  times_per_period: number
  remind_at?: string[]
  is_paused: boolean
  paused_until?: string
  streak: number
  longest_streak: number
  created_at: string
  archived_at?: string
}

export interface Completion {
  id: string
  habit_id: string
  user_id: string
  completed_at: string
  mood?: number
  note?: string
}

export interface Achievement {
  id: string
  user_id: string
  type: AchievementType
  habit_id?: string
  earned_at: string
}

export type AchievementType =
  | 'streak_3'
  | 'streak_7'
  | 'streak_14'
  | 'streak_30'
  | 'streak_100'
  | 'first_habit'
  | 'five_habits'
  | 'perfect_week'
  | 'perfect_month'

export const ACHIEVEMENT_META: Record<AchievementType, { title: string; desc: string; emoji: string; xp: number }> = {
  streak_3:     { title: '3 дня подряд',    desc: 'Отличное начало!',           emoji: '🔥', xp: 50  },
  streak_7:     { title: 'Неделя!',          desc: 'Настоящая привычка',         emoji: '⚡', xp: 100 },
  streak_14:    { title: 'Две недели',       desc: 'Ты крута!',                  emoji: '💫', xp: 200 },
  streak_30:    { title: 'Месяц!',           desc: 'Это уже часть тебя',         emoji: '🏆', xp: 500 },
  streak_100:   { title: '100 дней!',        desc: 'Легенда',                    emoji: '👑', xp: 1000},
  first_habit:  { title: 'Первая привычка',  desc: 'Путь начат',                 emoji: '🌱', xp: 30  },
  five_habits:  { title: '5 привычек',       desc: 'Серьёзный подход',           emoji: '🎯', xp: 150 },
  perfect_week: { title: 'Идеальная неделя', desc: 'Все привычки 7 дней подряд', emoji: '✨', xp: 300 },
  perfect_month:{ title: 'Идеальный месяц',  desc: 'Настоящая дисциплина',       emoji: '💎', xp: 1000},
}

export interface DailyMotivation {
  id: string
  date: string
  text: string
  author?: string
}
