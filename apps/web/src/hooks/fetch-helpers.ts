export { useFetchData, isNotFoundError } from './use-fetch-data';
export type {
  IUseFetchData,
  IFetchDataOptions,
  TUseFetchDataResult,
  TResponse,
  TResponseError,
  IMessageError,
} from './use-fetch-data';

export { useApiMutation } from './use-api-mutation';
export type { IApiMutationOptions } from './use-api-mutation';

export { useCacheUpdater } from './use-cache-updater';

export { useInfiniteFetchData } from './use-infinite-fetch-data';
export type {
  IUseInfiniteFetchData,
  IInfiniteFetchDataOptions,
} from './use-infinite-fetch-data';

export {
  clinicListOptions,
  LIVE_LIST_OPTIONS,
  DASHBOARD_OPTIONS,
  BILLING_OPTIONS,
  INVALIDATE,
  toQueryOptions,
} from './query-presets';

export { createCrudHooks } from './create-crud-hooks';
export type { CrudService, CrudHooksConfig } from './create-crud-hooks';
