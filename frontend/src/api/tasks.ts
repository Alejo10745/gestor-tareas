import axios from 'axios'

export type TaskStatus = 'pending' | 'in_progress' | 'done'

export interface Task {
  id: number
  title: string
  assignee: string
  status: TaskStatus
  createdAt: string
  updatedAt: string
}

export interface NewTask {
  title: string
  assignee: string
}

export const STATUS_LABELS: Record<TaskStatus, string> = {
  pending: 'Pendiente',
  in_progress: 'En curso',
  done: 'Hecha',
}

export class ApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

function messageForStatus(status: number) {
  if (status === 400) return 'Los datos enviados no son válidos.'
  if (status === 404) return 'La tarea ya no existe.'
  return `Error del servidor (${status}). Inténtalo de nuevo.`
}

function toApiError(error: unknown) {
  if (!axios.isAxiosError(error)) return error
  // No response means the request never reached the API (server down, network, timeout).
  if (!error.response) return new ApiError(0, 'No se pudo conectar con el servidor.')
  return new ApiError(error.response.status, messageForStatus(error.response.status))
}

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
})

// Every request fails with an ApiError, so the UI only deals with one error type.
http.interceptors.response.use(
  (response) => response,
  (error: unknown) => Promise.reject(toApiError(error)),
)

export function getErrorMessage(err: unknown) {
  return err instanceof ApiError ? err.message : 'Ha ocurrido un error inesperado.'
}

export async function getTasks(status?: TaskStatus) {
  // axios leaves out params that are undefined, so "all" sends no ?status=.
  const { data } = await http.get<Task[]>('/tasks', { params: { status } })
  return data
}

export async function createTask(task: NewTask) {
  const { data } = await http.post<Task>('/tasks', task)
  return data
}

export async function updateTaskStatus(id: number, status: TaskStatus) {
  const { data } = await http.patch<Task>(`/tasks/${id}/status`, { status })
  return data
}
