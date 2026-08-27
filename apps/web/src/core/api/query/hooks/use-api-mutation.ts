import {
  type QueryKey,
  useMutation,
  type UseMutationResult,
  useQueryClient,
} from '@tanstack/react-query';
import { toast } from 'sonner';
import { type TResponse, type TResponseError } from './use-fetch-data';

type SuccessMessage<TData, TVariables> =
  | string
  | ((_data: TData, _variables: TVariables) => string);

type ErrorMessage<TError, TVariables> =
  | string
  | ((_error: TError, _variables: TVariables) => string);

export interface IApiMutationOptions<
  TData,
  TError = TResponseError,
  TVariables = void,
  TContext = undefined,
> {
  request: (_data: TVariables) => Promise<TResponse<TData> | TData>;
  invalidateQueries?: QueryKey | QueryKey[];
  /** Toast on success — prefer this over hand-rolled sonner calls. */
  successMessage?: SuccessMessage<TData, TVariables>;
  /** Toast on error (API interceptor already toasts most errors). */
  errorMessage?: ErrorMessage<TError, TVariables>;
  onSuccess?: (_data: TData, _variables: TVariables, _context: TContext) => void;
  onError?: (_error: TError, _variables: TVariables, _context: TContext | undefined) => void;
  onMutate?: (_variables: TVariables) => Promise<TContext> | TContext;
  onSettled?: (
    _data: TData | undefined,
    _error: TError | null,
    _variables: TVariables,
    _context: TContext | undefined,
  ) => void;
  options?: { skipNormalization?: boolean };
}

function resolveMessage<TArg1, TArg2>(
  message: string | ((_a: TArg1, _b: TArg2) => string) | undefined,
  arg1: TArg1,
  arg2: TArg2,
): string | undefined {
  if (!message) return undefined;
  return typeof message === 'function' ? message(arg1, arg2) : message;
}

function isWrappedData<TData>(response: TResponse<TData> | TData): response is { data: TData } {
  return (
    typeof response === 'object' &&
    response !== null &&
    'data' in response
  );
}

function normalizeInvalidateKeys(
  invalidateQueries: QueryKey | QueryKey[] | undefined,
): QueryKey[] {
  if (!invalidateQueries) return [];
  if (Array.isArray(invalidateQueries) && Array.isArray(invalidateQueries[0])) {
    return invalidateQueries as QueryKey[];
  }
  return [invalidateQueries as QueryKey];
}

export const useApiMutation = <
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
  options,
}: IApiMutationOptions<TData, TError, TVariables, TContext>): UseMutationResult<
  TData,
  TError,
  TVariables,
  TContext
> => {
  const queryClient = useQueryClient();

  return useMutation<TData, TError, TVariables, TContext>({
    mutationFn: async (newData: TVariables) => {
      const response = await request(newData);
      if (!options?.skipNormalization && isWrappedData<TData>(response)) {
        return response.data;
      }
      return response as TData;
    },
    onMutate: onMutate
      ? async (variables: TVariables) => onMutate(variables)
      : undefined,
    onSuccess: (data, variables, context) => {
      for (const key of normalizeInvalidateKeys(invalidateQueries)) {
        queryClient.invalidateQueries({ queryKey: key });
      }
      const message = resolveMessage(successMessage, data, variables);
      if (message) toast.success(message);
      onSuccess?.(data, variables, context);
    },
    onError: (error, variables, context) => {
      const message = resolveMessage(errorMessage, error, variables);
      if (message) toast.error(message);
      onError?.(error, variables, context);
    },
    onSettled: (data, error, variables, context) => {
      onSettled?.(data, error, variables, context);
    },
  });
};

export default useApiMutation;
