import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';

class RegisterBody {
  name!: string;
  email!: string;
  password!: string;
  role!: 'ARQUITECTO' | 'COMERCIO';
}

class LoginBody {
  email!: string;
  password!: string;
}

@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterBody) {
    return this.auth.register(dto);
  }

  @Post('login')
  login(@Body() dto: LoginBody) {
    return this.auth.login(dto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  me(@Req() req: any) {
    return this.auth.me(req.user.userId);
  }
}
