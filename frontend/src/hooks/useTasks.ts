import { useCallback, useEffect, useState } from 'react'
import {
  createTask,
  getErrorMessage,
  getTasks,
  updateTaskStatus,
  type NewTask,
  type Task,
  type TaskStatus,
} from '../api/tasks'

export type StatusFilter = TaskStatus | 'all'

export function useTasks() {
  const [filter, setFilterState] = useState<StatusFilter>('all')
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadCount, setReloadCount] = useState(0)

  useEffect(() => {
    // Ignore the response if the filter changed before it arrived.
    let ignore = false

    getTasks(filter === 'all' ? undefined : filter)
      .then((data) => {
        if (!ignore) setTasks(data)
      })
      .catch((err: unknown) => {
        if (!ignore) setError(getErrorMessage(err))
      })
      .finally(() => {
        if (!ignore) setLoading(false)
      })

    return () => {
      ignore = true
    }
  }, [filter, reloadCount])

  // Loading starts from the event that triggers the request, not inside the effect.
  const setFilter = useCallback(
    (next: StatusFilter) => {
      if (next === filter) return
      setLoading(true)
      setError(null)
      setFilterState(next)
    },
    [filter],
  )

  const reload = useCallback(() => {
    setLoading(true)
    setError(null)
    setReloadCount((n) => n + 1)
  }, [])

  const matchesFilter = useCallback(
    (task: Task) => filter === 'all' || task.status === filter,
    [filter],
  )

  const addTask = useCallback(
    async (data: NewTask) => {
      const task = await createTask(data)
      if (matchesFilter(task)) {
        setTasks((prev) => [task, ...prev])
      }
    },
    [matchesFilter],
  )

  const changeStatus = useCallback(
    async (id: number, status: TaskStatus) => {
      const updated = await updateTaskStatus(id, status)
      setTasks((prev) =>
        matchesFilter(updated)
          ? prev.map((t) => (t.id === id ? updated : t))
          : prev.filter((t) => t.id !== id),
      )
    },
    [matchesFilter],
  )

  return {
    filter,
    setFilter,
    tasks,
    loading,
    error,
    reload,
    addTask,
    changeStatus,
  }
}
