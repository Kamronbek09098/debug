import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private readonly config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      // Token AuthModule da JWT_SECRET bilan imzolanadi — tekshiruvda
      // ham aynan o'sha kalit ishlatilishi shart, aks holda 401 chiqadi.
      secretOrKey: config.get<string>('JWT_SECRET') || 'men-juda-maxfiy-kalitman',
    });
  }

  async validate(payload: any) {
    // Bu obyekt request.user ga yoziladi
    return {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
    };
  }
}
