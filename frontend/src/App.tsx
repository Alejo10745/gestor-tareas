import { Card } from '@heroui/react'
import { StatusFilterBar } from './components/StatusFilterBar'
import { TaskForm } from './components/TaskForm'
import { TaskList } from './components/TaskList'
import { useTasks } from './hooks/useTasks'

export default function App() {
  const {
    filter,
    setFilter,
    tasks,
    loading,
    error,
    reload,
    addTask,
    changeStatus,
  } = useTasks()

  return (
    <main className="mx-auto grid max-w-3xl gap-5 px-4 py-8">
      <h1 className="text-2xl font-semibold">Gestor de tareas</h1>

      <Card>
        <Card.Header>
          <Card.Title>Nueva tarea</Card.Title>
        </Card.Header>
        <Card.Content>
          <TaskForm onSubmit={addTask} />
        </Card.Content>
      </Card>

      <Card>
        <Card.Header className="flex flex-row flex-wrap items-center justify-between gap-3">
          <Card.Title>Tareas</Card.Title>
          <StatusFilterBar value={filter} onChange={setFilter} />
        </Card.Header>
        <Card.Content>
          <TaskList
            tasks={tasks}
            loading={loading}
            error={error}
            onRetry={reload}
            onChangeStatus={changeStatus}
          />
        </Card.Content>
      </Card>
    </main>
  )
}
