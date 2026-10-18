import { LoadingState } from '@/components/primitives';
import { ClinicLockup } from '@/components/layout/clinic-identity';

export default function RootLoading() {
  return (
    <div className="grid min-h-dvh place-items-center bg-background">
      <div className="flex flex-col items-center gap-4" role="status" aria-live="polite">
        <div className="animate-clinic-breathe"><ClinicLockup /></div>
        <LoadingState variant="inline" text="Welcome…" />
      </div>
    </div>
  );
}
