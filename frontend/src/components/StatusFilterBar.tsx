import { ToggleButton, ToggleButtonGroup } from '@heroui/react'
import type { StatusFilter } from '../hooks/useTasks'

const OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'Todas' },
  { value: 'pending', label: 'Pendientes' },
  { value: 'in_progress', label: 'En curso' },
  { value: 'done', label: 'Hechas' },
]

interface Props {
  value: StatusFilter
  onChange: (value: StatusFilter) => void
}

export function StatusFilterBar({ value, onChange }: Props) {
  return (
    <ToggleButtonGroup
      aria-label="Filtrar por estado"
      size="sm"
      selectionMode="single"
      disallowEmptySelection
      selectedKeys={[value]}
      onSelectionChange={(keys) => {
        const [next] = keys
        if (next) onChange(next as StatusFilter)
      }}
    >
      {OPTIONS.map((option) => (
        <ToggleButton key={option.value} id={option.value}>
          {option.label}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  )
}
