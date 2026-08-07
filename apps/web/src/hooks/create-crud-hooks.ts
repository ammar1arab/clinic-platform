'use client';

import { toast } from 'sonner';
import { useFetchData } from './use-fetch-data';
import { useApiMutation } from './use-api-mutation';

type QueryKeyFactory = {
  all: readonly unknown[];
  list: (clinicId: string) => readonly unknown[];
};

export interface CrudService<TEntity, TCreate, TUpdate> {
  getAll: (clinicId: string) => Promise<TEntity[]>;
  create: (data: TCreate) => Promise<TEntity>;
  update: (id: string, data: TUpdate) => Promise<TEntity>;
  remove?: (id: string) => Promise<unknown>;
  deactivate?: (id: string) => Promise<unknown>;
  reactivate?: (id: string) => Promise<unknown>;
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

  function useList(clinicId: string) {
    return useFetchData<TEntity[]>({
      queryKey: keys.list(clinicId),
      request: () => service.getAll(clinicId),
      options: {
        enabled: !!clinicId,
      },
    });
  }

  function useCreate(clinicId: string) {
    return useApiMutation<TEntity, unknown, TCreate>({
      request: (data: TCreate) => service.create(data),
      invalidateQueries: keys.list(clinicId),
      onSuccess: () => {
        toast.success(labels.created);
      },
    });
  }

  function useUpdate(clinicId: string) {
    return useApiMutation<TEntity, unknown, { id: string; data: TUpdate }>({
      request: ({ id, data }: { id: string; data: TUpdate }) => service.update(id, data),
      invalidateQueries: keys.list(clinicId),
      onSuccess: () => {
        toast.success(labels.updated);
      },
    });
  }

  function useRemove(clinicId: string) {
    return useApiMutation<unknown, unknown, string>({
      request: (id: string) => {
        if (!service.remove) {
          throw new Error(`createCrudHooks(${entity}): service.remove is not configured`);
        }
        return service.remove(id);
      },
      invalidateQueries: keys.list(clinicId),
      onSuccess: () => {
        toast.success(labels.removed);
      },
    });
  }

  function useDeactivate(clinicId: string) {
    return useApiMutation<unknown, unknown, string>({
      request: (id: string) => {
        if (!service.deactivate) {
          throw new Error(`createCrudHooks(${entity}): service.deactivate is not configured`);
        }
        return service.deactivate(id);
      },
      invalidateQueries: keys.list(clinicId),
      onSuccess: () => {
        toast.success(labels.deactivated);
      },
    });
  }

  function useReactivate(clinicId: string) {
    return useApiMutation<unknown, unknown, string>({
      request: (id: string) => {
        if (!service.reactivate) {
          throw new Error(`createCrudHooks(${entity}): service.reactivate is not configured`);
        }
        return service.reactivate(id);
      },
      invalidateQueries: keys.list(clinicId),
      onSuccess: () => {
        toast.success(labels.reactivated);
      },
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
