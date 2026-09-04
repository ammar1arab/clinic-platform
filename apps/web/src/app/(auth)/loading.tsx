import { LoadingState } from "@/components/primitives";

export default function AuthLoading() {
  return (
    <div className="grid h-dvh place-items-center bg-muted/40 px-4">
      <LoadingState variant="spinner" className="size-8 text-primary/40 animate-spin" />
    </div>
  );
}
