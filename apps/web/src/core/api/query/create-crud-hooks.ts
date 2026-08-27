'use client';

import type { QueryKey } from '@tanstack/react-query';
import { useFetchData, type TResponseError } from './hooks/use-fetch-data';
import { useApiMutation } from './hooks/use-api-mutation';
import { clinicListOptions } from './query-presets';

type QueryKeyFactory = {
  all: QueryKey;
  list: (clinicId: string) => QueryKey;
};

export interface CrudService<TEntity, TCreate, TUpdate> {
  getAll: (clinicId: string) => Promise<TEntity[]>;
  create: (data: TCreate) => Promise<TEntity>;
  update: (id: string, data: TUpdate) => Promise<TEntity>;
  remove?: (id: string) => Promise<void | TEntity | null>;
  deactivate?: (id: string) => Promise<void | TEntity | null>;
  reactivate?: (id: string) => Promise<void | TEntity | null>;
}

export interface CrudHooksConfig<TEntity, TCreate, TUpdate> {
  keys: QueryKeyFactory;
  entity: string;
  labels?: {
    created?: string;
    updated?: string;
    removed?: string;
    deactivated?: string;
    reactivated?: string;
  };
  service: CrudService<TEntity, TCreate, TUpdate>;
  /** Extra keys to invalidate on every write (defaults to list only). */
  invalidateOnWrite?: (clinicId: string) => QueryKey[];
}

async function runSideEffect<TEntity>(
  fn: ((id: string) => Promise<void | TEntity | null>) | undefined,
  entity: string,
  action: string,
  id: string,
): Promise<null> {
  if (!fn) {
    throw new Error(`createCrudHooks(${entity}): service.${action} is not configured`);
  }
  await fn(id);
  return null;
}

export function createCrudHooks<TEntity, TCreate, TUpdate>(
  config: CrudHooksConfig<TEntity, TCreate, TUpdate>,
) {
  const { keys, entity, service } = config;
  const labels = {
    created: config.labels?.created ?? `${entity} created`,
    updated: config.labels?.updated ?? `${entity} updated`,
    removed: config.labels?.removed ?? `${entity} removed`,
    deactivated: config.labels?.deactivated ?? `${entity} deactivated`,
    reactivated: config.labels?.reactivated ?? `${entity} reactivated`,
  };

  const invalidateFor = (clinicId: string): QueryKey[] =>
    config.invalidateOnWrite?.(clinicId) ?? [keys.list(clinicId)];

  function useList(clinicId: string) {
    return useFetchData<TEntity[]>({
      queryKey: keys.list(clinicId),
      request: () => service.getAll(clinicId),
      options: clinicListOptions(clinicId),
    });
  }

  function useCreate(clinicId: string) {
    return useApiMutation<TEntity, TResponseError, TCreate>({
      request: (data) => service.create(data),
      invalidateQueries: invalidateFor(clinicId),
      successMessage: labels.created,
    });
  }

  function useUpdate(clinicId: string) {
    return useApiMutation<TEntity, TResponseError, { id: string; data: TUpdate }>({
      request: ({ id, data }) => service.update(id, data),
      invalidateQueries: invalidateFor(clinicId),
      successMessage: labels.updated,
    });
  }

  function useRemove(clinicId: string) {
    return useApiMutation<null, TResponseError, string>({
      request: (id) => runSideEffect(service.remove, entity, 'remove', id),
      invalidateQueries: invalidateFor(clinicId),
      successMessage: labels.removed,
    });
  }

  function useDeactivate(clinicId: string) {
    return useApiMutation<null, TResponseError, string>({
      request: (id) => runSideEffect(service.deactivate, entity, 'deactivate', id),
      invalidateQueries: invalidateFor(clinicId),
      successMessage: labels.deactivated,
    });
  }

  function useReactivate(clinicId: string) {
    return useApiMutation<null, TResponseError, string>({
      request: (id) => runSideEffect(service.reactivate, entity, 'reactivate', id),
      invalidateQueries: invalidateFor(clinicId),
      successMessage: labels.reactivated,
    });
  }

  return {
    useList,
    useCreate,
    useUpdate,
    useRemove,
    useDeactivate,
    useReactivate,
  };
}
