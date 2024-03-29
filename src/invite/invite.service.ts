import { MemberService } from './../member/member.service';
import { UsersService } from './../users/users.service';
import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtReqUser } from 'src/auth/auth.types';
import { BuylistService } from 'src/buylist/buylist.service';
import { Repository } from 'typeorm';
import { CreateInviteDto } from './dto/create-invite.dto';
import { Invite, InviteStatuses } from './invite.entity';

@Injectable()
export class InviteService {
  constructor(
    private readonly buylistService: BuylistService,
    private readonly usersService: UsersService,
    private readonly memberService: MemberService,
    @InjectRepository(Invite) private inviteRepo: Repository<Invite>,
  ) {}

  async findById(id: number) {
    const invite = await this.inviteRepo.findOne(id, {
      relations: ['buylist', 'from', 'to', 'buylist.members'],
    });
    if (!invite) {
      throw new HttpException(
        `Invite with id - ${id} not found`,
        HttpStatus.NOT_FOUND,
      );
    }
    return invite;
  }

  async findInvite(invite: CreateInviteDto) {
    const currentInvite = await this.inviteRepo.findOne({
      where: {
        buylist: {
          id: invite.buyListId,
        },
        to: {
          id: invite.to,
        },
      },
      relations: ['buylist', 'from', 'to', 'buylist.members'],
    });
    return currentInvite;
  }

  async create(invite: CreateInviteDto, user: JwtReqUser) {
    const userWasInvited = await this.findInvite(invite);

    if (userWasInvited) {
      throw new HttpException('This user was invited!', HttpStatus.BAD_REQUEST);
    }
    if (user.id === invite.to) {
      throw new HttpException(
        'You can`t invite yourself',
        HttpStatus.BAD_REQUEST,
      );
    }
    const buylist = await this.buylistService.findById(invite.buyListId);
    // Todo later guard
    const isMember = buylist.members.find(
      (member) => member.userId === user.id,
    );
    if (!isMember) {
      throw new HttpException(
        'You not member this buylist!',
        HttpStatus.BAD_REQUEST,
      );
    }
    // Check newMember is exist
    const memberExist = buylist.members.find(
      (member) => member.userId === invite.to,
    );
    if (memberExist) {
      throw new HttpException(
        'This user is member this buylist!',
        HttpStatus.BAD_REQUEST,
      );
    }

    const to = await this.usersService.findById(invite.to);
    const created = this.inviteRepo.create({
      buylist,
      to,
      from: user,
      status: InviteStatuses.EXPECTATION,
    });
    await this.inviteRepo.save(created);
    return created;
  }

  async accept(id: number, user: JwtReqUser) {
    const invite = await this.findById(id);
    if (invite.status !== InviteStatuses.EXPECTATION) {
      throw new HttpException(
        `You cannot accept this invitation because the status - ${invite.status}`,
        HttpStatus.BAD_REQUEST,
      );
    }
    if (invite.to.id !== user.id) {
      throw new HttpException(
        'This is not your invitation',
        HttpStatus.BAD_REQUEST,
      );
    }
    await this.memberService.create({
      user: invite.to,
      buylistId: invite.buylist.id,
    });
    invite.status = InviteStatuses.ACCEPTED;
    const updatedInvite = await this.inviteRepo.save(invite);
    return updatedInvite;
  }

  async decline(id: number, user: JwtReqUser) {
    const invite = await this.findById(id);
    if (invite.status !== InviteStatuses.EXPECTATION) {
      throw new HttpException(
        `You cannot decline this invitation because the status - ${invite.status}`,
        HttpStatus.BAD_REQUEST,
      );
    }
    if (invite.to.id !== user.id) {
      throw new HttpException(
        'This is not your invitation',
        HttpStatus.BAD_REQUEST,
      );
    }
    await this.inviteRepo.delete(invite.id);
    return true;
  }

  async leave(buyListId: number, user: JwtReqUser) {
    const invite = await this.findInvite({ buyListId, to: user.id });
    if (!invite) {
      throw new HttpException(
        `You cant't leave from this buylist`,
        HttpStatus.NOT_FOUND,
      );
    }

    if (invite.buylist.ownerId === user.id) {
      throw new HttpException(
        'You cant leave from this buylist, buy you owner!',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (invite.to.id !== user.id) {
      throw new HttpException(
        'This is not your invitation',
        HttpStatus.BAD_REQUEST,
      );
    }

    const result = await this.memberService.leave(invite, user);
    await this.inviteRepo.delete(invite.id);
    return result;
  }

  async getUserInvites(user: JwtReqUser) {
    const invites = await this.inviteRepo.find({
      where: {
        to: {
          id: user.id,
        },
      },
      relations: ['buylist', 'from', 'to'],
    });
    return invites;
  }
}
