import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateTaskDto } from './dto/create-task.dto';
import { TaskStatus } from './task-status.enum';
import { Task } from './task.entity';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task) private readonly tasks: Repository<Task>,
  ) {}

  findAll(status?: TaskStatus): Promise<Task[]> {
    return this.tasks.find({
      where: status ? { status } : {},
      order: { id: 'DESC' },
    });
  }

  create(dto: CreateTaskDto): Promise<Task> {
    const task = this.tasks.create({
      ...dto,
      status: dto.status ?? TaskStatus.Pending,
    });
    return this.tasks.save(task);
  }

  async updateStatus(id: number, status: TaskStatus): Promise<Task> {
    const task = await this.tasks.findOneBy({ id });
    if (!task) {
      throw new NotFoundException(`Task ${id} not found`);
    }
    task.status = status;
    return this.tasks.save(task);
  }
}
