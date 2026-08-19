import { User } from '@/modules/users/entities/user.entity';
import {
  CreateUserData,
  UserRepositoryPort,
} from '@/modules/users/user.repository.port';

export class InMemoryUserRepository implements UserRepositoryPort {
  private users: User[] = [];

  seed(users: User[]): void {
    this.users = users;
  }

  findByEmail(email: string): Promise<User | null> {
    return Promise.resolve(this.users.find((u) => u.email === email) ?? null);
  }

  save(data: CreateUserData): Promise<User> {
    const user = new User();
    Object.assign(user, data);
    user.id = `user-${this.users.length + 1}`;
    user.createdAt = new Date();
    user.updatedAt = new Date();
    this.users.push(user);
    return Promise.resolve(user);
  }
}
