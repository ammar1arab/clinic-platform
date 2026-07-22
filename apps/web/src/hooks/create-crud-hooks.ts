'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

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
  /** Singular label used in toast messages, e.g. "Department" */
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

function invalidateList(
  queryClient: ReturnType<typeof useQueryClient>,
  keys: QueryKeyFactory,
  clinicId: string,
) {
  queryClient.invalidateQueries({ queryKey: keys.list(clinicId) });
}

/**
 * Builds a consistent list + mutation hook set for clinic-scoped CRUD resources.
 *
 * @example
 * const {
 *   useList: useDepartments,
 *   useCreate: useCreateDepartment,
 * } = createCrudHooks({ keys: QUERY_KEYS.departments, entity: 'Department', service: departmentsService });
 */
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
    return useQuery({
      queryKey: keys.list(clinicId),
      queryFn: () => service.getAll(clinicId),
      enabled: !!clinicId,
    });
  }

  function useCreate(clinicId: string) {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (data: TCreate) => service.create(data),
      onSuccess: () => {
        invalidateList(queryClient, keys, clinicId);
        toast.success(labels.created);
      },
    });
  }

  function useUpdate(clinicId: string) {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: ({ id, data }: { id: string; data: TUpdate }) =>
        service.update(id, data),
      onSuccess: () => {
        invalidateList(queryClient, keys, clinicId);
        toast.success(labels.updated);
      },
    });
  }

  function useRemove(clinicId: string) {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (id: string) => {
        if (!service.remove) {
          throw new Error(`createCrudHooks(${entity}): service.remove is not configured`);
        }
        return service.remove(id);
      },
      onSuccess: () => {
        invalidateList(queryClient, keys, clinicId);
        toast.success(labels.removed);
      },
    });
  }

  function useDeactivate(clinicId: string) {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (id: string) => {
        if (!service.deactivate) {
          throw new Error(`createCrudHooks(${entity}): service.deactivate is not configured`);
        }
        return service.deactivate(id);
      },
      onSuccess: () => {
        invalidateList(queryClient, keys, clinicId);
        toast.success(labels.deactivated);
      },
    });
  }

  function useReactivate(clinicId: string) {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (id: string) => {
        if (!service.reactivate) {
          throw new Error(`createCrudHooks(${entity}): service.reactivate is not configured`);
        }
        return service.reactivate(id);
      },
      onSuccess: () => {
        invalidateList(queryClient, keys, clinicId);
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
