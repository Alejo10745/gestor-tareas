import {
  Alert,
  Button,
  FieldError,
  Form,
  Input,
  Label,
  TextField,
} from '@heroui/react'
import { useState, type FormEvent } from 'react'
import { getErrorMessage, type NewTask } from '../api/tasks'

type FieldErrors = Partial<Record<keyof NewTask, string>>

const EMPTY: NewTask = { title: '', assignee: '' }

function validateTask(values: NewTask): FieldErrors {
  const errors: FieldErrors = {}
  const title = values.title.trim()
  const assignee = values.assignee.trim()

  if (!title) errors.title = 'El título es obligatorio.'
  else if (title.length > 120) errors.title = 'Máximo 120 caracteres.'

  if (!assignee) errors.assignee = 'El responsable es obligatorio.'
  else if (assignee.length > 80) errors.assignee = 'Máximo 80 caracteres.'

  return errors
}

interface Props {
  onSubmit: (task: NewTask) => Promise<void>
}

export function TaskForm({ onSubmit }: Props) {
  const [values, setValues] = useState<NewTask>(EMPTY)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const handleChange = (field: keyof NewTask) => (value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const found = validateTask(values)
    setErrors(found)
    if (Object.keys(found).length > 0) return

    setSubmitting(true)
    setSubmitError(null)
    try {
      await onSubmit({
        title: values.title.trim(),
        assignee: values.assignee.trim(),
      })
      setValues(EMPTY)
    } catch (err) {
      setSubmitError(getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Form
      className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-start"
      onSubmit={handleSubmit}
      validationBehavior="aria"
    >
      <TextField
        name="title"
        value={values.title}
        onChange={handleChange('title')}
        isInvalid={Boolean(errors.title)}
      >
        <Label>Título</Label>
        <Input placeholder="Ej. Preparar la demo" />
        <FieldError>{errors.title}</FieldError>
      </TextField>

      <TextField
        name="assignee"
        value={values.assignee}
        onChange={handleChange('assignee')}
        isInvalid={Boolean(errors.assignee)}
      >
        <Label>Responsable</Label>
        <Input placeholder="Ej. Ana" />
        <FieldError>{errors.assignee}</FieldError>
      </TextField>

      <Button
        type="submit"
        variant="primary"
        isPending={submitting}
        className="sm:mt-6"
      >
        {submitting ? 'Creando…' : 'Crear tarea'}
      </Button>

      {submitError && (
        <Alert status="danger" role="alert" className="sm:col-span-3">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Description>{submitError}</Alert.Description>
          </Alert.Content>
        </Alert>
      )}
    </Form>
  )
}
