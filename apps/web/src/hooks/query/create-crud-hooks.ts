'use client';

import type { QueryKey } from '@tanstack/react-query';
import { useFetchData, type TResponseError } from './use-fetch-data';
import { useApiMutation } from './use-api-mutation';
import { clinicListOptions } from './query-presets';
import { useLanguage } from '@/providers';
import type { Translations } from '@/i18n';

type QueryKeyFactory = {
  all: QueryKey;
  list: (clinicId: string) => QueryKey;
};

export type CrudService<TEntity, TCreate, TUpdate> = {
  getAll: (clinicId: string) => Promise<TEntity[]>;
  create: (data: TCreate) => Promise<TEntity>;
  update: (id: string, data: TUpdate) => Promise<TEntity>;
  remove?: (id: string) => Promise<void | TEntity | null>;
  deactivate?: (id: string) => Promise<void | TEntity | null>;
  reactivate?: (id: string) => Promise<void | TEntity | null>;
};

export type CrudHooksConfig<TEntity, TCreate, TUpdate> = {
  keys: QueryKeyFactory;
  entity: keyof Translations['entities'];
  labels?: (t: Translations) => {
    created?: string;
    updated?: string;
    removed?: string;
    deactivated?: string;
    reactivated?: string;
  };
  service: CrudService<TEntity, TCreate, TUpdate>;
  invalidateOnWrite?: (clinicId: string) => QueryKey[];
};

async function runAction<TEntity>(
  fn: ((id: string) => Promise<void | TEntity | null>) | undefined,
  entity: string,
  action: string,
  id: string,
): Promise<null> {
  if (!fn) {
    throw new Error(`createCrudHooks(${entity}): ${action} not configured`);
  }
  await fn(id);
  return null;
}

export function createCrudHooks<TEntity, TCreate, TUpdate>(
  config: CrudHooksConfig<TEntity, TCreate, TUpdate>,
) {
  const { keys, entity, service } = config;

  const invalidateFor = (clinicId: string): QueryKey[] =>
    config.invalidateOnWrite?.(clinicId) ?? [keys.list(clinicId)];

  function useResolvedLabels() {
    const { t } = useLanguage();
    const entityName = t.entities[entity];
    const userLabels = config.labels?.(t) ?? {};
    return {
      created: userLabels.created ?? t.mutations.created.replace('{entity}', entityName),
      updated: userLabels.updated ?? t.mutations.updated.replace('{entity}', entityName),
      removed: userLabels.removed ?? t.mutations.removed.replace('{entity}', entityName),
      deactivated: userLabels.deactivated ?? t.mutations.deactivated.replace('{entity}', entityName),
      reactivated: userLabels.reactivated ?? t.mutations.reactivated.replace('{entity}', entityName),
    };
  }

  return {
    useList(clinicId: string) {
      return useFetchData<TEntity[]>({
        queryKey: keys.list(clinicId),
        request: () => service.getAll(clinicId),
        options: clinicListOptions(clinicId),
      });
    },
    useCreate(clinicId: string) {
      const labels = useResolvedLabels();
      return useApiMutation<TEntity, TResponseError, TCreate>({
        request: (data) => service.create(data),
        invalidateQueries: invalidateFor(clinicId),
        successMessage: labels.created,
      });
    },
    useUpdate(clinicId: string) {
      const labels = useResolvedLabels();
      return useApiMutation<
        TEntity,
        TResponseError,
        { id: string; data: TUpdate }
      >({
        request: ({ id, data }) => service.update(id, data),
        invalidateQueries: invalidateFor(clinicId),
        successMessage: labels.updated,
      });
    },
    useRemove(clinicId: string) {
      const labels = useResolvedLabels();
      return useApiMutation<null, TResponseError, string>({
        request: (id) => runAction(service.remove, entity, 'remove', id),
        invalidateQueries: invalidateFor(clinicId),
        successMessage: labels.removed,
      });
    },
    useDeactivate(clinicId: string) {
      const labels = useResolvedLabels();
      return useApiMutation<null, TResponseError, string>({
        request: (id) =>
          runAction(service.deactivate, entity, 'deactivate', id),
        invalidateQueries: invalidateFor(clinicId),
        successMessage: labels.deactivated,
      });
    },
    useReactivate(clinicId: string) {
      const labels = useResolvedLabels();
      return useApiMutation<null, TResponseError, string>({
        request: (id) =>
          runAction(service.reactivate, entity, 'reactivate', id),
        invalidateQueries: invalidateFor(clinicId),
        successMessage: labels.reactivated,
      });
    },
  };
}
