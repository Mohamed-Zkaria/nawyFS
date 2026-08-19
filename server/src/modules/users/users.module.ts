import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '@/modules/users/entities/user.entity';
import { UserRepositoryPort } from '@/modules/users/user.repository.port';
import { TypeOrmUserRepository } from '@/modules/users/repositories/typeorm-user.repository';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [{ provide: UserRepositoryPort, useClass: TypeOrmUserRepository }],
  exports: [UserRepositoryPort],
})
export class UsersModule {}
