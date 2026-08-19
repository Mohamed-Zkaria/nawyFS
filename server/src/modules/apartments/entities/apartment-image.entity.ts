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

  @Column({ name: 'storage_key', type: 'varchar', length: 255 })
  storageKey!: string;

  @Column({ name: 'original_name', type: 'varchar', length: 255 })
  originalName!: string;

  @Column({ name: 'mime_type', type: 'varchar', length: 100 })
  mimeType!: string;

  @Column({ name: 'size_bytes', type: 'integer' })
  sizeBytes!: number;

  @Column({ name: 'sort_order', type: 'smallint', default: 0 })
  sortOrder!: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
