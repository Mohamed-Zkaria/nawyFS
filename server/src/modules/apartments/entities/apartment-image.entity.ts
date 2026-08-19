import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Apartment } from '@/modules/apartments/entities/apartment.entity';

@Entity('apartment_images')
export class ApartmentImage {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'apartment_id', type: 'uuid' })
  apartmentId!: string;

  @ManyToOne(() => Apartment, (apartment) => apartment.images, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'apartment_id' })
  apartment!: Apartment;

  // An admin-supplied external URL — there is no upload pipeline in this
  // project, so this is never a locally-composed path.
  @Column({ type: 'varchar', length: 2048 })
  url!: string;

  @Column({ name: 'sort_order', type: 'smallint', default: 0 })
  sortOrder!: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
