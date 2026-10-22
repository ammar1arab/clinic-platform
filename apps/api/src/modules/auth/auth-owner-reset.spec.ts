import { AuthService } from './auth.service';
import type { AuthRepository } from './auth.repository';
import type { TokenService } from '@/security/services/token.service';
import type { OtpService } from '@/security/services/otp.service';
import type { PasswordPolicyService } from '@/security/services/password-policy.service';
import type { RateLimitService } from '@/security/services/rate-limit.service';
import type { AuthUser } from './types';

const owner: AuthUser = { clinicId: 'clinic', clinicUserId: 'owner-member', userId: 'owner-user', role: 'owner' };
const target = { id: 'doctor-user', email: 'doctor@example.invalid', passwordChangedAt: null, clinicUsers: [{ clinicId: 'clinic' }] };

describe('Owner password reset for a staff account', () => {
  const repo = {
    otpAccount: jest.fn().mockResolvedValue(target),
    clinicOwner: jest.fn().mockResolvedValue({ id: 'owner-user', email: 'owner@example.invalid' }),
    byId: jest.fn().mockResolvedValue(target),
    changePassword: jest.fn().mockResolvedValue(target),
  };
  const tokens = {
    verify: jest.fn().mockReturnValue({
      sub: 'doctor-user', passwordVersion: 0, purpose: 'password_change', challengeId: 'challenge',
      email: 'owner@example.invalid', clinicUserId: 'doctor-member', clinicId: 'clinic',
    }),
  };
  const otp = { consume: jest.fn().mockResolvedValue({ email: 'owner@example.invalid' }) };
  const service = new AuthService(
    repo as unknown as AuthRepository,
    tokens as unknown as TokenService,
    otp as unknown as OtpService,
    { hash: jest.fn().mockResolvedValue('hash') } as unknown as PasswordPolicyService,
    {} as RateLimitService,
  );

  it('sets a final password so the account signs in without another setup step', async () => {
    await service.confirmOwnerPasswordChange(owner, 'doctor-member', 'token', '123456', 'Password!234');
    expect(otp.consume).toHaveBeenCalledWith('challenge', 'doctor-user', 'FORGOT_PASSWORD', '123456');
    expect(repo.changePassword).toHaveBeenCalledWith('doctor-user', null, 'hash');
  });
});
