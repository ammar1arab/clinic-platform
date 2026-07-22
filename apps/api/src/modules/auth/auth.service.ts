import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '@/prisma/prisma.service';
import { RegisterDto, LoginDto } from './dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
      },
    });

    const clinicUser = await this.prisma.clinicUser.create({
      data: {
        userId: user.id,
        clinicId: dto.clinicId,
        name: dto.name,
        role: 'owner',
      },
    });

    return this.generateToken(user.id, clinicUser.id, clinicUser.clinicId, clinicUser.role);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { clinicUsers: true },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);

    if (!passwordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const clinicUser = user.clinicUsers[0];

    if (!clinicUser) {
      throw new UnauthorizedException('No clinic association found');
    }

    return this.generateToken(user.id, clinicUser.id, clinicUser.clinicId, clinicUser.role);
  }

  async getMe(userId: string, clinicUserId: string) {
    const clinicUser = await this.prisma.clinicUser.findUnique({
      where: { id: clinicUserId },
      include: { clinic: true, user: true },
    });

    if (!clinicUser) {
      throw new UnauthorizedException('Account not found');
    }

    return {
      userId,
      clinicUserId: clinicUser.id,
      role: clinicUser.role,
      name: clinicUser.name,
      email: clinicUser.user.email,
      clinic: {
        id: clinicUser.clinic.id,
        name: clinicUser.clinic.name,
        workingHoursStart: clinicUser.clinic.workingHoursStart,
        workingHoursEnd: clinicUser.clinic.workingHoursEnd,
        timezone: clinicUser.clinic.timezone,
      },
    };
  }

  private generateToken(userId: string, clinicUserId: string, clinicId: string, role: string) {
    const payload = { sub: userId, clinicUserId, clinicId, role };
    return {
      accessToken: this.jwtService.sign(payload),
    };
  }
}