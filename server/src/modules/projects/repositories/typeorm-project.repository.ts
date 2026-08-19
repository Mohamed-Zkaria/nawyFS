import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from '@/modules/projects/entities/project.entity';
import {
  CreateProjectData,
  ProjectRepositoryPort,
} from '@/modules/projects/project.repository.port';

@Injectable()
export class TypeOrmProjectRepository implements ProjectRepositoryPort {
  constructor(
    @InjectRepository(Project)
    private readonly repo: Repository<Project>,
  ) {}

  findAll(): Promise<Project[]> {
    return this.repo.find({ order: { name: 'ASC' } });
  }

  findById(id: string): Promise<Project | null> {
    return this.repo.findOne({ where: { id } });
  }

  findByName(name: string): Promise<Project | null> {
    return this.repo.findOne({ where: { name } });
  }

  save(data: CreateProjectData): Promise<Project> {
    return this.repo.save(this.repo.create(data));
  }
}
