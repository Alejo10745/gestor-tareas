import { Button, Chip, type ChipProps } from '@heroui/react'
import { useState } from 'react'
import {
  getErrorMessage,
  STATUS_LABELS,
  type Task,
  type TaskStatus,
} from '../api/tasks'

// Each button moves the task one step forward; "Reabrir" sends it back to the start.
const NEXT_STATUS: Record<TaskStatus, TaskStatus> = {
  pending: 'in_progress',
  in_progress: 'done',
  done: 'pending',
}

const ACTION_LABELS: Record<TaskStatus, string> = {
  pending: 'Empezar',
  in_progress: 'Terminar',
  done: 'Reabrir',
}

const STATUS_COLORS: Record<TaskStatus, ChipProps['color']> = {
  pending: 'warning',
  in_progress: 'accent',
  done: 'success',
}

interface Props {
  task: Task
  onChangeStatus: (id: number, status: TaskStatus) => Promise<void>
}

export function TaskItem({ task, onChangeStatus }: Props) {
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handlePress = async () => {
    setUpdating(true)
    setError(null)
    try {
      await onChangeStatus(task.id, NEXT_STATUS[task.status])
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setUpdating(false)
    }
  }

  return (
    <li
      className="flex flex-wrap items-center gap-3 border-t border-separator py-3 first:border-t-0"
      data-testid={`task-${task.id}`}
    >
      <div className="min-w-0 flex-1">
        <p className="font-medium break-words">{task.title}</p>
        <p className="text-sm text-muted">{task.assignee}</p>
      </div>
      <Chip color={STATUS_COLORS[task.status]} variant="soft" size="sm">
        {STATUS_LABELS[task.status]}
      </Chip>
      <Button
        size="sm"
        variant="secondary"
        onPress={handlePress}
        isPending={updating}
      >
        {updating ? 'Guardando…' : ACTION_LABELS[task.status]}
      </Button>
      {error && (
        <p role="alert" className="w-full text-sm text-danger">
          {error}
        </p>
      )}
    </li>
  )
}
