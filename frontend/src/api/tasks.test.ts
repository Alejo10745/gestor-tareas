import { AxiosError, type AxiosAdapter, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError, getTasks, http, updateTaskStatus } from './tasks'

// Swap the part of axios that does the network call. Requests still go through
// our instance's config and interceptors, but never leave the test.
const adapter = vi.fn<AxiosAdapter>()

const response = (config: InternalAxiosRequestConfig, status: number, data: unknown = null): AxiosResponse => ({
  data,
  status,
  statusText: '',
  headers: {},
  config,
})

describe('tasks API client', () => {
  beforeEach(() => {
    adapter.mockReset()
    http.defaults.adapter = adapter
  })

  it('only adds ?status= when a status is given', async () => {
    adapter.mockImplementation(async (config) => response(config, 200, []))

    await getTasks()
    await getTasks('done')

    const [all, done] = adapter.mock.calls.map(([config]) => http.getUri(config))
    expect(all).toBe('/api/tasks')
    expect(done).toBe('/api/tasks?status=done')
  })

  it('turns an HTTP error into an ApiError with a readable message', async () => {
    adapter.mockImplementation(async (config) => {
      throw new AxiosError('Request failed', AxiosError.ERR_BAD_REQUEST, config, null, response(config, 404))
    })

    const error = await updateTaskStatus(999, 'done').catch((err: unknown) => err)

    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ status: 404, message: 'La tarea ya no existe.' })
  })

  it('reports a connection error when the API does not answer', async () => {
    adapter.mockRejectedValue(new AxiosError('Network Error', AxiosError.ERR_NETWORK))

    const error = await getTasks().catch((err: unknown) => err)

    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ status: 0, message: 'No se pudo conectar con el servidor.' })
  })
})
