import { Injectable, Scope } from '@nestjs/common';
import { UsersService } from '../users.service';
import * as DataLoader from 'dataloader';

@Injectable({ scope: Scope.REQUEST })
export default class UsersLoaders {
  constructor(private usersService: UsersService) {}

  public readonly batchAuthors = new DataLoader(async (authorIds: number[]) => {
    const users = await this.usersService.getByIds(authorIds);
    const usersMap = new Map(users.map((user) => [user.id, user]));
    return authorIds.map((authorId) => usersMap.get(authorId));
  });
}
