import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Project } from '@/modules/projects/entities/project.entity';
import { ApartmentImage } from '@/modules/apartments/entities/apartment-image.entity';

@Entity('apartments')
@Index('idx_apartments_project_id', ['projectId'])
@Index('idx_apartments_created_at', ['createdAt'])
export class Apartment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'unit_name', type: 'varchar', length: 120 })
  unitName!: string;

  @Column({ name: 'unit_number', type: 'varchar', length: 40 })
  unitNumber!: string;

  @Column({ name: 'project_id', type: 'uuid' })
  projectId!: string;

  @ManyToOne(() => Project, (project) => project.apartments, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'project_id' })
  project!: Project;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  price!: string;

  @Column({ type: 'smallint' })
  bedrooms!: number;

  @Column({ type: 'smallint' })
  bathrooms!: number;

  @Column({ name: 'area_sqm', type: 'numeric', precision: 8, scale: 2 })
  areaSqm!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt!: Date | null;

  @OneToMany(() => ApartmentImage, (image) => image.apartment)
  images!: ApartmentImage[];
}
