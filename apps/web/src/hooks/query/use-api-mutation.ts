import {
  type QueryKey,
  useMutation,
  type UseMutationResult,
  useQueryClient,
} from '@tanstack/react-query';
import axios from 'axios';
import { toast } from 'sonner';
import { createLogger } from '@/lib/logger';
import {
  errorText,
  unwrapResponse,
  type TResponse,
  type TResponseError,
} from './query-normalize';

const log = createLogger('hooks/mutation');

type Message<TData, TVariables> =
  | string
  | ((data: TData, variables: TVariables) => string);

export type ApiMutationOptions<
  TData,
  TError = TResponseError,
  TVariables = void,
  TContext = undefined,
> = {
  request: (data: TVariables) => Promise<TResponse<TData> | TData>;
  invalidateQueries?: QueryKey | QueryKey[];
  successMessage?: Message<TData, TVariables>;
  errorMessage?: Message<TError, TVariables>;
  onSuccess?: (data: TData, variables: TVariables, context: TContext) => void;
  onError?: (
    error: TError,
    variables: TVariables,
    context: TContext | undefined,
  ) => void;
  onMutate?: (variables: TVariables) => Promise<TContext> | TContext;
  onSettled?: (
    data: TData | undefined,
    error: TError | null,
    variables: TVariables,
    context: TContext | undefined,
  ) => void;
  skipNormalization?: boolean;
};

function resolveMessage<A, B>(
  message: Message<A, B> | undefined,
  a: A,
  b: B,
): string | undefined {
  if (!message) return undefined;
  return typeof message === 'function' ? message(a, b) : message;
}

function invalidateKeys(keys: QueryKey | QueryKey[] | undefined): QueryKey[] {
  if (!keys) return [];
  if (Array.isArray(keys) && Array.isArray(keys[0])) return keys as QueryKey[];
  return [keys as QueryKey];
}

export function useApiMutation<
  TData,
  TError = TResponseError,
  TVariables = void,
  TContext = undefined,
>({
  request,
  invalidateQueries,
  successMessage,
  errorMessage,
  onSuccess,
  onError,
  onMutate,
  onSettled,
  skipNormalization,
}: ApiMutationOptions<TData, TError, TVariables, TContext>): UseMutationResult<
  TData,
  TError,
  TVariables,
  TContext
> {
  const queryClient = useQueryClient();

  return useMutation<TData, TError, TVariables, TContext>({
    mutationFn: async (variables) => {
      const raw = await request(variables);
      return unwrapResponse(raw, skipNormalization);
    },
    onMutate: onMutate
      ? async (variables) => onMutate(variables)
      : undefined,
    onSuccess: (data, variables, context) => {
      for (const key of invalidateKeys(invalidateQueries)) {
        void queryClient.invalidateQueries({ queryKey: key });
      }
      const message = resolveMessage(successMessage, data, variables);
      if (message) toast.success(message);
      log.debug('ok', { message: message ?? null });
      onSuccess?.(data, variables, context);
    },
    onError: (error, variables, context) => {
      const message =
        resolveMessage(errorMessage, error, variables) ?? errorText(error);
      if (errorMessage) toast.error(message);
      if (axios.isAxiosError(error)) log.warn('failed', { message });
      else log.error('failed', error instanceof Error ? error : { message });
      onError?.(error, variables, context);
    },
    onSettled: (data, error, variables, context) => {
      onSettled?.(data, error, variables, context);
    },
  });
}

export type { ApiMutationOptions as IApiMutationOptions };
