export { queryClient } from './client';
export {
  useFetchData,
  isNotFoundError,
  type IUseFetchData,
  type IFetchDataOptions,
  type IMessageError,
  type TResponse,
  type TResponseError,
  type TUseFetchDataResult,
} from './hooks/use-fetch-data';
export {
  useApiMutation,
  type IApiMutationOptions,
} from './hooks/use-api-mutation';
export {
  useInfiniteFetchData,
  type IUseInfiniteFetchData,
  type IInfiniteFetchDataOptions,
} from './hooks/use-infinite-fetch-data';
export { useCacheUpdater } from './hooks/use-cache-updater';
export {
  createCrudHooks,
  type CrudHooksConfig,
  type CrudService,
} from './create-crud-hooks';
export {
  clinicListOptions,
  LIVE_LIST_OPTIONS,
  DASHBOARD_OPTIONS,
  BILLING_OPTIONS,
  toQueryOptions,
  INVALIDATE,
} from './query-presets';
