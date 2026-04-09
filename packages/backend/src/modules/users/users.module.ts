import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Company } from './entities/company.entity';
import { CompanyUser } from './entities/company-user.entity';
import { UsersService } from './users.service';
import { AuthService } from './auth.service';
import { UsersController } from './users.controller';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    TypeOrmModule.forFeature([Company, CompanyUser]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get('jwt.secret'),
        signOptions: { expiresIn: config.get('jwt.expiration') },
      }),
    }),
  ],
  controllers: [AuthController, UsersController],
  providers: [UsersService, AuthService, JwtStrategy],
  exports: [UsersService, AuthService, JwtModule],
})
export class UsersModule {}
