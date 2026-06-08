'use client'

import { useEffect, useState } from 'react'
import { Todo } from '@/types'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Check, Trash2, Plus, Calendar, ChevronDown, ChevronUp, Pencil } from 'lucide-react'
import { format, isPast, isToday, isTomorrow } from 'date-fns'
import { ru } from 'date-fns/locale'

interface Props {
  telegramId: number
  firstName?: string
  username?: string
}

function deadlineLabel(d: string) {
  const date = new Date(d)
  const time = format(date, 'HH:mm')
  if (isToday(date)) return `Сегодня, ${time}`
  if (isTomorrow(date)) return `Завтра, ${time}`
  return format(date, 'd MMM, HH:mm', { locale: ru })
}

// Convert ISO/DB datetime to datetime-local input value
function toInputValue(d: string) {
  const date = new Date(d)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

interface TodoFormState {
  title: string
  description: string
  deadline: string
}

const EMPTY_FORM: TodoFormState = { title: '', description: '', deadline: '' }

export default function TodoView({ telegramId, firstName, username }: Props) {
  const [todos, setTodos] = useState<Todo[]>([])
  const [showCompleted, setShowCompleted] = useState(false)
  const [dialog, setDialog] = useState<'add' | 'edit' | null>(null)
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null)
  const [form, setForm] = useState<TodoFormState>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    const res = await fetch(`/api/todos?telegram_id=${telegramId}`)
    setTodos(await res.json())
  }

  function openAdd() {
    setForm(EMPTY_FORM)
    setEditingTodo(null)
    setDialog('add')
  }

  function openEdit(todo: Todo) {
    setForm({
      title: todo.title,
      description: todo.description ?? '',
      deadline: todo.deadline ? toInputValue(todo.deadline) : '',
    })
    setEditingTodo(todo)
    setDialog('edit')
  }

  function closeDialog() {
    setDialog(null)
    setEditingTodo(null)
    setForm(EMPTY_FORM)
  }

  async function handleSave() {
    if (!form.title.trim()) return
    setSaving(true)

    if (dialog === 'add') {
      await fetch('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telegram_id: telegramId,
          first_name: firstName,
          username,
          title: form.title.trim(),
          description: form.description.trim() || null,
          deadline: form.deadline || null,
        }),
      })
    } else if (dialog === 'edit' && editingTodo) {
      await fetch('/api/todos', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingTodo.id,
          title: form.title.trim(),
          description: form.description.trim() || null,
          deadline: form.deadline || null,
        }),
      })
    }

    setSaving(false)
    closeDialog()
    await load()
  }

  async function handleToggle(todo: Todo) {
    await fetch('/api/todos', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: todo.id, completed: !todo.completed }),
    })
    setTodos((prev) => prev.map((t) => t.id === todo.id ? { ...t, completed: !t.completed } : t))
  }

  async function handleDelete(id: string) {
    await fetch(`/api/todos?id=${id}`, { method: 'DELETE' })
    setTodos((prev) => prev.filter((t) => t.id !== id))
  }

  const active = todos.filter((t) => !t.completed)
  const completed = todos.filter((t) => t.completed)

  return (
    <div className="space-y-3">
      <button
        onClick={openAdd}
        className="w-full flex items-center gap-3 p-4 rounded-2xl border border-dashed border-border text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors"
      >
        <div className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center shrink-0">
          <Plus className="w-4 h-4" />
        </div>
        <span className="text-sm">Добавить задачу...</span>
      </button>

      {active.length === 0 && completed.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
          <div className="text-5xl">✅</div>
          <p className="text-sm text-muted-foreground">Задач пока нет.<br />Добавь первую!</p>
        </div>
      )}

      {active.map((todo) => (
        <TodoCard key={todo.id} todo={todo} onToggle={handleToggle} onEdit={openEdit} onDelete={handleDelete} />
      ))}

      {completed.length > 0 && (
        <div>
          <button
            onClick={() => setShowCompleted((v) => !v)}
            className="flex items-center gap-2 text-xs text-muted-foreground py-2 w-full"
          >
            {showCompleted ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            Выполнено ({completed.length})
          </button>
          {showCompleted && completed.map((todo) => (
            <TodoCard key={todo.id} todo={todo} onToggle={handleToggle} onEdit={openEdit} onDelete={handleDelete} />
          ))}
        </div>
      )}

      {/* Add / Edit dialog */}
      <Dialog open={dialog !== null} onOpenChange={(o) => !o && closeDialog()}>
        <DialogContent className="max-w-[calc(100vw-2rem)] rounded-3xl mx-auto">
          <DialogHeader>
            <DialogTitle>{dialog === 'edit' ? 'Редактировать задачу' : 'Новая задача'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-1">
            <Input
              placeholder="Название задачи..."
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className="h-11 rounded-xl"
            />
            <Textarea
              placeholder="Описание (необязательно)..."
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="resize-none rounded-xl text-sm"
              rows={2}
            />
            <div>
              <p className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> Дедлайн
              </p>
              <input
                type="datetime-local"
                value={form.deadline}
                onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))}
                className="w-full h-10 rounded-xl border border-input bg-transparent px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <Button
              onClick={handleSave}
              disabled={!form.title.trim() || saving}
              className="w-full h-11 rounded-2xl bg-violet-500 hover:bg-violet-600 text-white font-semibold"
            >
              {dialog === 'edit' ? 'Сохранить изменения' : 'Добавить'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

interface CardProps {
  todo: Todo
  onToggle: (t: Todo) => void
  onEdit: (t: Todo) => void
  onDelete: (id: string) => void
}

function TodoCard({ todo, onToggle, onEdit, onDelete }: CardProps) {
  const overdue = todo.deadline && !todo.completed && isPast(new Date(todo.deadline))

  return (
    <div className={`flex items-start gap-3 p-4 rounded-2xl border transition-all ${todo.completed ? 'opacity-50 bg-muted/20' : 'bg-card'}`}>
      <button
        onClick={() => onToggle(todo)}
        className={`w-6 h-6 mt-0.5 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all ${
          todo.completed ? 'bg-violet-500 border-violet-500' : 'border-border hover:border-violet-400'
        }`}
      >
        {todo.completed && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
      </button>

      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium leading-tight ${todo.completed ? 'line-through text-muted-foreground' : ''}`}>
          {todo.title}
        </p>
        {todo.description && (
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{todo.description}</p>
        )}
        {todo.deadline && (
          <p className={`text-xs mt-1 flex items-center gap-1 ${overdue ? 'text-red-400 font-medium' : 'text-muted-foreground'}`}>
            <Calendar className="w-3 h-3" />
            {deadlineLabel(todo.deadline)}
            {overdue && ' · просрочено'}
          </p>
        )}
      </div>

      <div className="flex items-center gap-0.5 shrink-0">
        {!todo.completed && (
          <button
            onClick={() => onEdit(todo)}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-muted transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
        )}
        <button
          onClick={() => onDelete(todo.id)}
          className="w-7 h-7 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-red-50 hover:text-red-400 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}
