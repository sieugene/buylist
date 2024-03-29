import { JwtReqPayloadUser, JwtReqUser } from '../auth.types';
import { jwtConstants } from '../constants';
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { AuthService } from '../auth.service';
import { Request } from 'express';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          const tokenFromCookie = request?.cookies?.Authentication;
          if (!tokenFromCookie) {
            const tokenFromHeaders =
              ExtractJwt.fromAuthHeaderAsBearerToken()(request);
            return tokenFromHeaders;
          }
          return tokenFromCookie;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: jwtConstants.secret,
    });
  }

  async validate(payload: JwtReqPayloadUser): Promise<JwtReqUser> {
    const user = await this.authService.find(payload.email);
    return user;
  }
}
