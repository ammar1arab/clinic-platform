import { extractErrorMessage } from '@/lib/api';
import { useLanguage } from '@/providers';
import type {
  AccountProfileInput,
  AuthEmailChange,
  AuthPasswordChange,
  AuthPasswordConfirmInput,
  AuthForgotInput,
  AuthLoginInput,
  AuthLoginResponse,
  AuthMe,
  AuthPasswordInput,
  AuthRecovery,
  AuthReset,
  AuthTokenInput,
  AuthVerifyInput,
  OwnerOtpResponse,
  OwnerResetPasswordInput,
} from '@clinic/types';
import { authService } from '@/services/auth.service';
import { useApiMutation } from '@/hooks/query/use-api-mutation';

type AuthCommand =
  | { action: 'login'; data: AuthLoginInput }
  | { action: 'guest' }
  | { action: 'forgotPassword'; data: AuthForgotInput }
  | { action: 'sendOtp'; data: AuthTokenInput }
  | { action: 'verifyOtp'; data: AuthVerifyInput }
  | { action: 'setPassword' | 'resetPassword'; data: AuthPasswordInput };

export function useAuthMutation() {
  return useApiMutation<AuthLoginResponse | AuthRecovery | AuthReset, unknown, AuthCommand>({
    request: command => {
      switch (command.action) {
        case 'login': return authService.login(command.data);
        case 'guest': return authService.guest();
        case 'forgotPassword': return authService.forgotPassword(command.data);
        case 'sendOtp': return authService.sendOtp(command.data);
        case 'verifyOtp': return authService.verifyOtp(command.data);
        case 'setPassword': return authService.setPassword(command.data);
        case 'resetPassword': return authService.resetPassword(command.data);
      }
    },
  });
}

export function useOwnerResetPassword(id: string) {
  const { t } = useLanguage();
  return useApiMutation<{ success: true }, Error, OwnerResetPasswordInput>({
    request: (input) => authService.ownerResetPassword(id, input),
    successMessage: t.common.accountPasswordReset,
  });
}

export function useOwnerGenerateOtp() {
  return useApiMutation<OwnerOtpResponse, Error, string>({
    request: authService.ownerGenerateOtp,
    errorMessage: (error) => extractErrorMessage(error),
  });
}

export function useRequestEmailChange() {
  return useApiMutation<AuthEmailChange, Error, string>({
    request: (email) => authService.requestEmailChange(email),
    errorMessage: (error) => extractErrorMessage(error),
  });
}

export function useRequestPasswordChange() {
  return useApiMutation<AuthPasswordChange, Error, void>({
    request: () => authService.requestPasswordChange(),
    errorMessage: (error) => extractErrorMessage(error),
  });
}

export function useConfirmPasswordChange() {
  const { t } = useLanguage();
  return useApiMutation<{ success: true }, Error, AuthPasswordConfirmInput>({
    request: (input) => authService.confirmPasswordChange(input),
    successMessage: t.common.accountPasswordReset,
  });
}

export function useConfirmEmailChange() {
  return useApiMutation<{ success: true }, Error, AuthVerifyInput>({
    request: (input) => authService.confirmEmailChange(input),
  });
}

export function useUpdateAccountProfile() {
  const { t } = useLanguage();
  return useApiMutation<AuthMe, Error, AccountProfileInput>({
    request: authService.updateProfile,
    invalidateQueries: [['auth', 'me']],
    successMessage: t.common.clinicSettingsSaved,
    errorMessage: (error) => extractErrorMessage(error),
  });
}
