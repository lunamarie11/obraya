import { IsEmail, IsEnum, IsString, IsNotEmpty, Length } from 'class-validator';
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

  @ApiProperty({ enum: UserRole })
  @IsEnum(UserRole)
  role: UserRole;
}
