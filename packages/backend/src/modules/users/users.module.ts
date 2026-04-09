import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// MVP: Company registration, user auth (JWT), role-based access (Admin, Vendedor, Logistica, Contabilidad)

@Module({
  imports: [
    // TypeOrmModule.forFeature([User, Company, Role, Permission]),
  ],
  controllers: [
    // UserController,
    // AuthController,
  ],
  providers: [
    // UserService,
    // AuthService,
    // JwtStrategy,
  ],
  exports: [
    // UserService,
    // AuthService,
  ],
})
export class UsersModule {}
