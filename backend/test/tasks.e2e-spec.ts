import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import request from 'supertest';
import { App } from 'supertest/types';
import { setupApp } from '../src/app.setup';
import { TasksModule } from '../src/tasks/tasks.module';

type TaskBody = { id: number; title: string; assignee: string; status: string };
type ErrorBody = { statusCode: number; message: string | string[] };

describe('Tasks API (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'better-sqlite3',
          database: ':memory:',
          autoLoadEntities: true,
          synchronize: true,
        }),
        TasksModule,
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    setupApp(app);
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  const api = () => request(app.getHttpServer());

  const createTask = async (body: object) => {
    const res = await api().post('/api/tasks').send(body).expect(201);
    return res.body as TaskBody;
  };

  it('creates a task as pending and trims the text fields', async () => {
    const task = await createTask({ title: '  Write docs  ', assignee: 'Ana' });

    expect(task).toMatchObject({
      id: expect.any(Number) as number,
      title: 'Write docs',
      assignee: 'Ana',
      status: 'pending',
    });
  });

  it('returns 400 when the body is not valid', async () => {
    const res = await api()
      .post('/api/tasks')
      .send({ title: '   ', status: 'archived', foo: 'bar' })
      .expect(400);

    const { message } = res.body as ErrorBody;
    expect(message).toEqual(
      expect.arrayContaining([
        'title should not be empty',
        'assignee must be a string',
        'status must be one of the following values: pending, in_progress, done',
        'property foo should not exist',
      ]),
    );
  });

  it('filters the list by status', async () => {
    const first = await createTask({ title: 'A', assignee: 'Ana' });
    await createTask({ title: 'B', assignee: 'Luis', status: 'done' });
    await api()
      .patch(`/api/tasks/${first.id}/status`)
      .send({ status: 'in_progress' });

    const all = await api().get('/api/tasks').expect(200);
    const inProgress = await api()
      .get('/api/tasks?status=in_progress')
      .expect(200);

    expect(all.body).toHaveLength(2);
    expect((inProgress.body as TaskBody[]).map((t) => t.title)).toEqual(['A']);
  });

  it('returns 400 for an unknown status filter', async () => {
    await api().get('/api/tasks?status=archived').expect(400);
  });

  it('changes the status of a task', async () => {
    const task = await createTask({ title: 'Deploy', assignee: 'Ana' });

    const res = await api()
      .patch(`/api/tasks/${task.id}/status`)
      .send({ status: 'done' })
      .expect(200);

    expect((res.body as TaskBody).status).toBe('done');
  });

  it('returns 404 when the task does not exist', async () => {
    const res = await api()
      .patch('/api/tasks/999/status')
      .send({ status: 'done' })
      .expect(404);

    expect((res.body as ErrorBody).message).toBe('Task 999 not found');
  });

  it('returns 400 when the id is not a number', async () => {
    await api()
      .patch('/api/tasks/abc/status')
      .send({ status: 'done' })
      .expect(400);
  });
});
