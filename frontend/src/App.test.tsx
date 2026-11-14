import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError, getTasks, updateTaskStatus, type Task } from './api/tasks'
import App from './App'

// These tests check what the UI asks the API for and how it reacts.
// The HTTP details (URLs, error mapping) are covered in api/tasks.test.ts.
vi.mock('./api/tasks', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./api/tasks')>()),
  getTasks: vi.fn(),
  createTask: vi.fn(),
  updateTaskStatus: vi.fn(),
}))

const task = (overrides: Partial<Task> = {}): Task => ({
  id: 1,
  title: 'Preparar demo',
  assignee: 'Ana',
  status: 'pending',
  createdAt: '2026-11-13T10:00:00.000Z',
  updatedAt: '2026-11-13T10:00:00.000Z',
  ...overrides,
})

describe('App', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('shows a loading message and then the tasks from the API', async () => {
    vi.mocked(getTasks).mockResolvedValueOnce([task(), task({ id: 2, title: 'Revisar PR', status: 'done' })])
    render(<App />)

    expect(screen.getByRole('status')).toHaveTextContent('Cargando tareas…')
    expect(await screen.findByText('Preparar demo')).toBeInTheDocument()
    expect(screen.getByText('Revisar PR')).toBeInTheDocument()
    expect(getTasks).toHaveBeenCalledWith(undefined)
  })

  it('shows an error when loading fails and lets the user retry', async () => {
    vi.mocked(getTasks)
      .mockRejectedValueOnce(new ApiError(500, 'Error del servidor (500). Inténtalo de nuevo.'))
      .mockResolvedValueOnce([task()])
    render(<App />)

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('No se pudieron cargar las tareas')

    await userEvent.click(within(alert).getByRole('button', { name: 'Reintentar' }))

    expect(await screen.findByText('Preparar demo')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('asks the API for the selected status when filtering', async () => {
    vi.mocked(getTasks).mockResolvedValueOnce([task()]).mockResolvedValueOnce([])
    render(<App />)
    await screen.findByText('Preparar demo')

    // HeroUI renders a single-selection ToggleButtonGroup as a radio group.
    await userEvent.click(screen.getByRole('radio', { name: 'Hechas' }))

    expect(getTasks).toHaveBeenLastCalledWith('done')
    expect(await screen.findByText('No hay tareas que mostrar.')).toBeInTheDocument()
  })

  it('moves a task to the next status with its button', async () => {
    vi.mocked(getTasks).mockResolvedValueOnce([task()])
    vi.mocked(updateTaskStatus).mockResolvedValueOnce(task({ status: 'in_progress' }))
    render(<App />)

    const item = await screen.findByTestId('task-1')
    await userEvent.click(within(item).getByRole('button', { name: 'Empezar' }))

    expect(updateTaskStatus).toHaveBeenCalledWith(1, 'in_progress')
    expect(await within(item).findByText('En curso')).toBeInTheDocument()
    expect(within(item).getByRole('button', { name: 'Terminar' })).toBeInTheDocument()
  })
})
