import { Alert, Button, Spinner } from '@heroui/react'
import type { Task, TaskStatus } from '../api/tasks'
import { TaskItem } from './TaskItem'

interface Props {
  tasks: Task[]
  loading: boolean
  error: string | null
  onRetry: () => void
  onChangeStatus: (id: number, status: TaskStatus) => Promise<void>
}

export function TaskList({
  tasks,
  loading,
  error,
  onRetry,
  onChangeStatus,
}: Props) {
  if (loading) {
    return (
      <div
        role="status"
        className="flex items-center justify-center gap-2 py-8 text-muted"
      >
        <Spinner size="sm" aria-hidden />
        Cargando tareas…
      </div>
    )
  }

  if (error) {
    return (
      <Alert status="danger" role="alert">
        <Alert.Indicator />
        <Alert.Content>
          <Alert.Title>No se pudieron cargar las tareas</Alert.Title>
          <Alert.Description>{error}</Alert.Description>
        </Alert.Content>
        <Button size="sm" variant="danger" onPress={onRetry}>
          Reintentar
        </Button>
      </Alert>
    )
  }

  if (tasks.length === 0) {
    return <p className="py-8 text-center text-muted">No hay tareas que mostrar.</p>
  }

  return (
    <ul>
      {tasks.map((task) => (
        <TaskItem key={task.id} task={task} onChangeStatus={onChangeStatus} />
      ))}
    </ul>
  )
}
