import { FormPageSkeleton } from '@/components/primitives';

export default function EditAppointmentLoading() {
  return (
    <div className="mx-auto w-full min-w-0 max-w-3xl">
      <FormPageSkeleton />
    </div>
  );
}
