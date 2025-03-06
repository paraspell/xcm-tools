import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { User } from './user.entity.js';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  create() {
    return this.usersRepository.save({});
  }

  findOne(userId: string) {
    return this.usersRepository.findOneBy({
      id: userId,
    });
  }
}
