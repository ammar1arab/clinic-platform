import type { AuthForgotInput, AuthLoginInput, AuthLoginResponse, AuthPasswordInput, AuthRecovery, AuthReset, AuthTokenInput, AuthVerifyInput } from '@clinic/types';
import { authService } from '@/services/auth.service';
import { useApiMutation } from '@/hooks/query/use-api-mutation';

type AuthCommand =
  | { action: 'login'; data: AuthLoginInput }
  | { action: 'forgotPassword'; data: AuthForgotInput }
  | { action: 'sendOtp'; data: AuthTokenInput }
  | { action: 'verifyOtp'; data: AuthVerifyInput }
  | { action: 'setPassword' | 'resetPassword'; data: AuthPasswordInput };

export function useAuthMutation() {
  return useApiMutation<AuthLoginResponse | AuthRecovery | AuthReset, unknown, AuthCommand>({
    request: command => {
      switch (command.action) {
        case 'login': return authService.login(command.data);
        case 'forgotPassword': return authService.forgotPassword(command.data);
        case 'sendOtp': return authService.sendOtp(command.data);
        case 'verifyOtp': return authService.verifyOtp(command.data);
        case 'setPassword': return authService.setPassword(command.data);
        case 'resetPassword': return authService.resetPassword(command.data);
      }
    },
  });
}
