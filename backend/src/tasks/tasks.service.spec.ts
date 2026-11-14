import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TaskStatus } from './task-status.enum';
import { Task } from './task.entity';
import { TasksService } from './tasks.service';

describe('TasksService', () => {
  let service: TasksService;
  const repository = {
    create: jest.fn((data: Partial<Task>) => data),
    save: jest.fn((task: Partial<Task>) => Promise.resolve({ id: 1, ...task })),
    findOneBy: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        TasksService,
        { provide: getRepositoryToken(Task), useValue: repository },
      ],
    }).compile();

    service = moduleRef.get(TasksService);
  });

  it('creates new tasks as pending when no status is given', async () => {
    const task = await service.create({ title: 'Review PR', assignee: 'Ana' });

    expect(task.status).toBe(TaskStatus.Pending);
  });

  it('throws NotFoundException and saves nothing if the task does not exist', async () => {
    repository.findOneBy.mockResolvedValue(null);

    await expect(
      service.updateStatus(42, TaskStatus.Done),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(repository.save).not.toHaveBeenCalled();
  });
});
