import { LoadingState } from "@/components/primitives";
import { ClinicLockup } from "@/components/layout/clinic-identity";

export default function AuthLoading() {
  return (
    <div className="grid h-dvh place-items-center bg-background px-4">
      <div className="flex flex-col items-center gap-4" role="status" aria-live="polite">
        <div className="animate-clinic-breathe"><ClinicLockup /></div>
        <LoadingState variant="spinner" className="size-5 text-primary/50" />
      </div>
    </div>
  );
}
