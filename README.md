# Gestor de tareas

App pequeña para crear tareas, listarlas, filtrarlas por estado y cambiar su estado. Cada tarea tiene título, estado (pendiente, en curso o hecha) y responsable.

- **Backend:** NestJS 11 + TypeORM + SQLite, en TypeScript.
- **Frontend:** React 19 + Vite + HeroUI v3 (Tailwind CSS 4), en TypeScript.
- **Tests:** Jest + Supertest en el backend, Vitest + Testing Library en el frontend.

## Cómo ejecutarlo

### Con Docker (un solo comando)

```bash
docker compose up --build
```

Abre http://localhost:8080. Los datos se guardan en el volumen `tasks-data`, así que no se pierden al reiniciar. Para borrarlo todo: `docker compose down -v`.

### Sin Docker

Necesitas Node 20.19+ o 22.12+ (lo probé con 22.18).

```bash
npm run setup   # instala dependencias de la raíz, backend y frontend
npm run dev     # arranca la API (puerto 3000) y el front (puerto 5173)
```

Abre http://localhost:5173. La base de datos se crea sola en `backend/data/tasks.sqlite`.

### Tests

```bash
npm test
```

Ejecuta los tests unitarios y e2e del backend y los del frontend.

## API

| Método  | Ruta                        | Cuerpo                                  | Respuestas                                                              |
| ------- | --------------------------- | --------------------------------------- | ----------------------------------------------------------------------- |
| `GET`   | `/api/tasks`                | —                                       | 200                                                                     |
| `GET`   | `/api/tasks?status=pending` | —                                       | 200, o 400 si el estado no existe                                       |
| `POST`  | `/api/tasks`                | `{ "title": "...", "assignee": "..." }` | 201, o 400 si los datos no son válidos                                  |
| `PATCH` | `/api/tasks/:id/status`     | `{ "status": "done" }`                  | 200, 400 si el id o el estado no son válidos, 404 si la tarea no existe |

Estados válidos: `pending`, `in_progress`, `done`.

Ejemplo de error de validación:

```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": ["title should not be empty", "assignee must be a string"]
}
```

## Estructura

```
.
├── backend/
│   ├── src/tasks/        entidad, DTOs, servicio y controlador de tareas
│   └── test/             tests e2e de la API
├── frontend/
│   └── src/
│       ├── api/          cliente HTTP y tipos
│       ├── hooks/        useTasks: carga, filtro y cambios de estado
│       └── components/   formulario, filtro, lista y fila de tarea
├── docker-compose.yml
└── package.json          scripts para instalar, arrancar y testear todo
```

## Decisiones

**Backend**

- **NestJS 11 en vez de 12.** Nest 12 pide Node 22.22 o superior, y `@nestjs/typeorm` 12 solo se distribuye como ESM, que Jest no carga con Node 22.18. Nest 11 funciona con las versiones de Node más habituales y es la versión que ya conocía.
- **SQLite con TypeORM y `better-sqlite3`.** No hace falta levantar otro servicio y en Docker es un solo archivo en un volumen. Uso `synchronize: true` para que las tablas se creen solas; en producción usaría migraciones.
- **Validación con `class-validator`** y un `ValidationPipe` global con `whitelist` y `forbidNonWhitelisted`: responde 400 si falta un campo, si el texto supera el máximo o si se envían campos que no existen. El título y el responsable se guardan sin espacios al principio ni al final.
- **Endpoint propio para el estado** (`PATCH /tasks/:id/status`) en lugar de un `PATCH` genérico. Es la única modificación que pide la prueba y así la intención queda clara.
- **Los valores del estado van en inglés en la API** (`pending`, `in_progress`, `done`) y las etiquetas en español solo en el front.
- **La configuración de la app (`setupApp`) se comparte** entre `main.ts` y los tests e2e, para que los tests usen el mismo prefijo y la misma validación que la app real.

**Frontend**

- **HeroUI v3** para los componentes (Card, TextField, Button, Chip, Alert, Spinner, ToggleButtonGroup). Está construido sobre React Aria, así que la accesibilidad (labels, `aria-invalid`, foco, teclado) viene resuelta.
- **Un hook `useTasks`** concentra la carga, el filtro, la creación y el cambio de estado. No añadí React Query para mantener la app pequeña.
- **axios para las peticiones**, con una instancia propia (`baseURL` `/api`) y un interceptor que convierte cualquier fallo en un `ApiError` con un mensaje en español. Así los componentes solo manejan un tipo de error.
- **El filtro lo aplica la API** (`?status=`), no el front.
- **Tras crear o cambiar una tarea, actualizo la lista local** con la respuesta de la API en vez de volver a pedirla entera. Si la tarea deja de cumplir el filtro activo, desaparece de la lista.
- **El botón de estado avanza la tarea un paso:** Empezar → Terminar → Reabrir (vuelve a pendiente).
- **Validación en el formulario** antes de llamar a la API, con el mensaje debajo de cada campo. Si la API falla, se muestra el error y no se pierde lo escrito.
- **Estados de carga y error visibles:** spinner al cargar, alerta con botón "Reintentar" si falla la lista, y error en la propia fila si falla un cambio de estado.
- **Sin CORS:** en desarrollo Vite reenvía `/api` a la API, y en Docker lo hace nginx.

**Docker**

- Imágenes multi-stage. El backend corre con un usuario sin privilegios y no publica puertos: solo se accede a través del nginx del front.

## Qué haría con más tiempo

- Migraciones de TypeORM en vez de `synchronize`.
- Validar en el backend qué cambios de estado están permitidos.
- Paginación y orden configurable en el listado.
- Editar y borrar tareas.
- Documentar la API con OpenAPI (`@nestjs/swagger`).
- Devolver errores de validación por campo para mostrarlos en el formulario.
- TanStack Query en el front para caché y reintentos.
- Un test end-to-end con Playwright contra el `docker compose`.
- CI con GitHub Actions (lint, tests y build).
- Responsables como usuarios reales en vez de texto libre.

## Tiempo invertido

Unas 2 horas en total, incluida la revisión del código.

## Cómo usé la IA

Usé Claude Code (Claude Opus 5.5) como asistente durante la prueba.

**Qué le pedí**

- Que generara el proyecto a partir del enunciado: API, frontend, tests y Docker.
- El stack lo decidí yo: NestJS para el backend, porque ya lo había usado en otros proyectos.
- A mitad del desarrollo le pedí pasar los componentes del front a HeroUI.
- Que me explicara cada decisión para poder revisarla.

Correcciones, al ver errores en la instalación, los tests o el linter:

- Empezó con NestJS 12 y tuvo que bajar a la 11 porque la 12 pide una versión de Node más nueva que la mía.
- Cambió `@nestjs/typeorm` 12 por la 11 (con TypeORM 0.3) porque Jest no cargaba la versión ESM.
- Movió el `setLoading(true)` del `useEffect` a los eventos que lanzan la carga, por un aviso del linter.
- Quitó un `role="status"` duplicado: el `Spinner` de HeroUI ya lo trae.

**Qué acepté**

Revisé el código parte por parte con sus explicaciones y lo probé en local antes de entregarlo. Me quedé con:

- La estructura del backend por módulos y la validación con DTOs y un `ValidationPipe` global.
- El hook `useTasks` para la carga, el filtro y los cambios de estado, sin añadir una librería de datos.
- Los tests: unitarios y e2e en el backend, y de componentes y del cliente de API en el front.

**Qué cambié yo sobre su propuesta**

Estos cambios los decidí yo y los implementó la IA a petición mía:

- Pasé los componentes a HeroUI para tener accesibilidad y un estilo coherente sin escribir CSS a mano.
- Cambié `fetch` por axios: la URL base y la gestión de errores quedan en una instancia con un interceptor, y los componentes solo reciben un tipo de error.
