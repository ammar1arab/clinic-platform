'use client';

import { useRouter } from 'next/navigation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { TruncatedText } from '@/components/primitives/truncated-text';
import { Pagination } from '@/components/primitives/pagination';
import { EmptyState } from '@/components/primitives/empty-state';
import { MetaStat } from '@/components/primitives/meta-stat';
import { TableSkeleton } from '@/components/primitives/skeleton-presets';
import { TableFrame } from '@/components/blocks/data/table-frame';
import { IconEdit, IconPhone, IconPractitioner } from '@/constants/icons';
import { PRACTITIONER_EMPLOYMENT_LABEL } from '@/constants/practitioner';
import { ROUTES } from '@/constants/routes';
import {
  useDeactivatePractitioner,
  useReactivatePractitioner,
} from '@/hooks/use-practitioners';
import type { Practitioner } from '@/services/practitioners.service';

function initials(p: Practitioner) {
  if (p.initials?.trim()) return p.initials.slice(0, 2).toUpperCase();
  return p.name.slice(0, 2).toUpperCase() || '?';
}

function displayName(p: Practitioner) {
  return p.title ? `${p.title} ${p.name}` : p.name;
}

interface Props {
  pageItems: Practitioner[];
  isLoading: boolean;
  clinicId: string;
  search: string;
  page: number;
  pageCount: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  emptyAction?: React.ReactNode;
}

export function PractitionersList({
  pageItems,
  isLoading,
  clinicId,
  search,
  page,
  pageCount,
  totalItems,
  pageSize,
  onPageChange,
  emptyAction,
}: Props) {
  const router = useRouter();
  const deactivate = useDeactivatePractitioner(clinicId);
  const reactivate = useReactivatePractitioner(clinicId);

  const toggling = deactivate.isPending || reactivate.isPending;
  const toggle = (p: Practitioner, on: boolean) =>
    on ? reactivate.mutate(p.id) : deactivate.mutate(p.id);

  const openProfile = (id: string) => router.push(ROUTES.PRACTITIONER_DETAIL(id));

  if (isLoading) {
    return <TableSkeleton rows={8} cols={7} hasHeader={false} />;
  }

  if (totalItems === 0) {
    return (
      <TableFrame>
        <EmptyState
          icon={IconPractitioner}
          title={search ? 'No matches' : 'No practitioners'}
          description={
            search
              ? 'Try a different name, email, or department.'
              : 'Create a practitioner with department, services, and availability.'
          }
          action={search ? undefined : emptyAction}
        />
      </TableFrame>
    );
  }

  return (
    <>
      <div className="hidden md:block">
        <TableFrame>
          <Table className="table-fixed">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[22%]">Practitioner</TableHead>
                <TableHead className="w-[14%]">Phone</TableHead>
                <TableHead className="hidden lg:table-cell w-[14%]">Department</TableHead>
                <TableHead className="hidden xl:table-cell w-[12%]">Room</TableHead>
                <TableHead className="w-[10%]">Services</TableHead>
                <TableHead className="hidden lg:table-cell w-[12%]">Employment</TableHead>
                <TableHead className="hidden xl:table-cell w-[8%]">Buffer</TableHead>
                <TableHead className="w-[8%]">Active</TableHead>
                <TableHead className="w-[8%]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageItems.map((p) => (
                <TableRow
                  key={p.id}
                  className={`cursor-pointer ${!p.isActive ? 'opacity-60' : ''}`}
                  onClick={() => openProfile(p.id)}
                >
                  <TableCell className="max-w-0 overflow-hidden">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <Avatar size="sm">
                        {p.imageUrl ? <AvatarImage src={p.imageUrl} alt="" /> : null}
                        <AvatarFallback>{initials(p)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <TruncatedText className="font-medium">
                          {displayName(p)}
                        </TruncatedText>
                        <TruncatedText className="text-xs text-muted-foreground">
                          {p.email}
                        </TruncatedText>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-0 overflow-hidden text-muted-foreground">
                    <TruncatedText>{p.phone ?? '—'}</TruncatedText>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell max-w-0 overflow-hidden text-muted-foreground">
                    <TruncatedText>{p.departmentName ?? '—'}</TruncatedText>
                  </TableCell>
                  <TableCell className="hidden xl:table-cell max-w-0 overflow-hidden text-muted-foreground">
                    <TruncatedText>{p.defaultRoomName ?? '—'}</TruncatedText>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {p.serviceIds.length}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {p.employmentType ? (
                      <Badge variant="secondary" className="font-normal">
                        {PRACTITIONER_EMPLOYMENT_LABEL[p.employmentType] ??
                          p.employmentType}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="hidden xl:table-cell text-muted-foreground">
                    {p.bufferMins}m
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Switch
                      checked={p.isActive}
                      disabled={toggling}
                      onCheckedChange={(on) => toggle(p, on)}
                    />
                  </TableCell>
                  <TableCell
                    className="text-right"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7"
                      onClick={() => router.push(ROUTES.PRACTITIONERS_EDIT(p.id))}
                    >
                      <IconEdit className="size-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableFrame>
      </div>

      <div className="grid grid-cols-1 gap-2.5 md:hidden">
        {pageItems.map((p) => (
          <div
            key={p.id}
            role="button"
            tabIndex={0}
            onClick={() => openProfile(p.id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                openProfile(p.id);
              }
            }}
            className={`cursor-pointer rounded-xl bg-card p-3 ring-1 ring-foreground/10 ${
              !p.isActive ? 'opacity-60' : ''
            }`}
          >
            <div className="flex items-start gap-3">
              <Avatar>
                {p.imageUrl ? <AvatarImage src={p.imageUrl} alt="" /> : null}
                <AvatarFallback>{initials(p)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <TruncatedText className="font-medium">{displayName(p)}</TruncatedText>
                <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <IconPhone className="size-3 shrink-0" />
                  <TruncatedText>{p.phone ?? p.email}</TruncatedText>
                </div>
              </div>
              <div
                className="flex shrink-0 items-center gap-1"
                onClick={(e) => e.stopPropagation()}
              >
                <Switch
                  checked={p.isActive}
                  disabled={toggling}
                  onCheckedChange={(on) => toggle(p, on)}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7"
                  onClick={() => router.push(ROUTES.PRACTITIONERS_EDIT(p.id))}
                >
                  <IconEdit className="size-3.5" />
                </Button>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 border-t pt-2.5 text-xs sm:grid-cols-3">
              <MetaStat label="Department" value={p.departmentName ?? '—'} />
              <MetaStat label="Room" value={p.defaultRoomName ?? '—'} />
              <MetaStat label="Services" value={String(p.serviceIds.length)} />
              <MetaStat
                label="Employment"
                value={
                  p.employmentType
                    ? PRACTITIONER_EMPLOYMENT_LABEL[p.employmentType] ??
                      p.employmentType
                    : '—'
                }
              />
              <MetaStat label="Buffer" value={`${p.bufferMins}m`} />
              <MetaStat
                label="Experience"
                value={
                  p.experienceYears != null ? `${p.experienceYears} yrs` : '—'
                }
              />
            </div>
          </div>
        ))}
      </div>

      <Pagination
        page={page}
        pageCount={pageCount}
        totalItems={totalItems}
        pageSize={pageSize}
        onPageChange={onPageChange}
      />
    </>
  );
}
