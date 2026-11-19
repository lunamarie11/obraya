import { IsEmail, IsString, IsNotEmpty, Length, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../entities/company-user.entity';

export class InviteUserDto {
  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  firstName: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  lastName: string;

  // SEGURIDAD (19/11/2026): una empresa no puede crear usuarios SuperAdmin
  // (rol de la plataforma ObraYa).
  @ApiProperty({ enum: [UserRole.ADMIN, UserRole.VENDEDOR, UserRole.LOGISTICA, UserRole.CONTABILIDAD] })
  @IsIn([UserRole.ADMIN, UserRole.VENDEDOR, UserRole.LOGISTICA, UserRole.CONTABILIDAD], {
    message: 'Rol inválido',
  })
  role: UserRole;
}
