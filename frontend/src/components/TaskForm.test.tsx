import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ApiError } from '../api/tasks'
import { TaskForm } from './TaskForm'

describe('TaskForm', () => {
  it('shows the validation errors and does not submit an empty form', async () => {
    const onSubmit = vi.fn()
    render(<TaskForm onSubmit={onSubmit} />)

    await userEvent.type(screen.getByLabelText('Título'), '   ')
    await userEvent.click(screen.getByRole('button', { name: 'Crear tarea' }))

    expect(screen.getByText('El título es obligatorio.')).toBeInTheDocument()
    expect(screen.getByText('El responsable es obligatorio.')).toBeInTheDocument()
    expect(screen.getByLabelText('Título')).toHaveAttribute('aria-invalid', 'true')
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('sends the trimmed values and clears the form', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    render(<TaskForm onSubmit={onSubmit} />)

    await userEvent.type(screen.getByLabelText('Título'), '  Preparar demo ')
    await userEvent.type(screen.getByLabelText('Responsable'), 'Ana')
    await userEvent.click(screen.getByRole('button', { name: 'Crear tarea' }))

    expect(onSubmit).toHaveBeenCalledWith({ title: 'Preparar demo', assignee: 'Ana' })
    expect(screen.getByLabelText('Título')).toHaveValue('')
    expect(screen.getByLabelText('Responsable')).toHaveValue('')
  })

  it('keeps the values and shows the error if the API fails', async () => {
    const onSubmit = vi
      .fn()
      .mockRejectedValue(new ApiError(500, 'Error del servidor (500). Inténtalo de nuevo.'))
    render(<TaskForm onSubmit={onSubmit} />)

    await userEvent.type(screen.getByLabelText('Título'), 'Preparar demo')
    await userEvent.type(screen.getByLabelText('Responsable'), 'Ana')
    await userEvent.click(screen.getByRole('button', { name: 'Crear tarea' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Error del servidor (500)')
    expect(screen.getByLabelText('Título')).toHaveValue('Preparar demo')
  })
})
