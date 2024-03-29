import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Like, Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from './user.entity';
import * as bcrypt from 'bcrypt';
import { UpdateUserInput } from './inputs/update-user.input';
import { JwtReqUser } from 'src/auth/auth.types';

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private usersRepo: Repository<User>) {}

  async findOne(email: string): Promise<User> {
    const user = await this.usersRepo.findOne({
      where: { email },
    });
    return user;
  }

  async findById(id: number): Promise<User> {
    const user = await this.usersRepo.findOne({ id });
    if (!user) {
      throw new HttpException(
        `User with id ${id} not found`,
        HttpStatus.NOT_FOUND,
      );
    }
    return user;
  }

  async getByIds(ids: number[]) {
    return this.usersRepo.find({
      where: { id: In(ids) },
    });
  }

  async register(user: CreateUserDto): Promise<User> {
    const hashedPassword = await bcrypt.hash(user.password, 10);
    const isExist = await this.findOne(user?.email);
    if (!isExist) {
      const newUser = this.usersRepo.create({
        ...user,
        password: hashedPassword,
      });
      await this.usersRepo.save(newUser);
      const { password, ...result } = newUser;
      return {
        ...result,
        password: undefined,
      };
    }
    throw new HttpException(
      'User with that email already exists',
      HttpStatus.BAD_REQUEST,
    );
  }

  async findUser(id: number) {
    const user = await this.usersRepo.findOne(id);
    if (!user) {
      throw new HttpException(
        `User with id ${id} not found`,
        HttpStatus.NOT_FOUND,
      );
    }
    return user;
  }

  async updateUser(fields: UpdateUserInput, user: JwtReqUser) {
    const { id } = user;
    let currentUser = await this.findUser(id);

    currentUser = {
      ...currentUser,
      ...fields,
    };
    const updated = await this.usersRepo.save(currentUser);
    return updated;
  }

  async searchUsers(query: string) {
    const users = await this.usersRepo.find({
      where: {
        email: Like(`%${query}%`),
      },
      cache: true,
      take: 10,
    });
    return users;
  }
}
