import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, pass: string) {
    const user = await this.usersService.findByEmail(email);

    if (!user || !user.password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (pass === user.password) {
      const { password, ...result } = user;

      return result;
    }

    throw new UnauthorizedException('Invalid credentials');
  }

  async login(user: any) {
    const payload = {
      email: user.email,
      sub: user.id,
      roles: Array.isArray(user.roles) ? user.roles : [user.roles],
    };
    console.log('JWT Payload:', payload);
    const token = this.jwtService.sign(payload);
    console.log('Generated JWT:', token);
    return {
      payload: payload,
      access_token: this.jwtService.sign(payload),
    };
  }
}
