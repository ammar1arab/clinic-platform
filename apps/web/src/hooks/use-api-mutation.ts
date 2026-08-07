import {
  type QueryKey,
  useMutation,
  type UseMutationResult,
  useQueryClient,
} from '@tanstack/react-query';
import { TResponse } from './use-fetch-data';

export interface IApiMutationOptions<TData, TError = unknown, TVariables = void, TContext = unknown> {
  request: (_data: TVariables) => Promise<TResponse<TData> | TData>;
  invalidateQueries?: QueryKey | QueryKey[];
  onSuccess?: (_data: TData, _variables: TVariables, _context?: TContext) => void;
  onError?: (_error: TError, _variables: TVariables, _context?: TContext) => void;
  onMutate?: (_variables: TVariables) => Promise<TContext> | TContext;
  onSettled?: (_data: TData | undefined, _error: TError | null, _variables: TVariables, _context?: TContext) => void;
  options?: { skipNormalization?: boolean };
}

export const useApiMutation = <
  TData = unknown,
  TError = unknown,
  TVariables = void,
  TContext = unknown,
>({
  request,
  invalidateQueries,
  onSuccess,
  onError,
  onMutate,
  onSettled,
  options,
}: IApiMutationOptions<TData, TError, TVariables, TContext>): UseMutationResult<TData, TError, TVariables, TContext> => {
  const queryClient = useQueryClient();
  return useMutation<TData, TError, TVariables, TContext>({
    mutationFn: async (newData: TVariables) => {
      const response = await request(newData);
      if (response && typeof response === 'object' && 'data' in response && !options?.skipNormalization) {
        return (response as { data: TData }).data;
      }
      return response as TData;
    },
    onMutate: (onMutate ? async (variables: TVariables) => onMutate(variables) : undefined) as never,
    onSuccess: (data: TData, variables: TVariables, context: TContext) => {
      if (invalidateQueries) {
        if (Array.isArray(invalidateQueries) && Array.isArray(invalidateQueries[0])) {
          for (const key of invalidateQueries as QueryKey[]) {
            queryClient.invalidateQueries({ queryKey: key });
          }
        } else {
          queryClient.invalidateQueries({ queryKey: invalidateQueries as QueryKey });
        }
      }
      onSuccess?.(data, variables, context);
    },
    onError: (error: TError, variables: TVariables, context: TContext | undefined) => {
      onError?.(error, variables, context);
    },
    onSettled: (data: TData | undefined, error: TError | null, variables: TVariables, context: TContext | undefined) => {
      onSettled?.(data, error, variables, context);
    },
  });
};

export default useApiMutation;
