export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="h-4 w-32 animate-pulse rounded bg-sand" />
      <div className="h-9 w-72 max-w-full animate-pulse rounded bg-sand" />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="h-32 animate-pulse rounded-[7px] bg-muted-warm" />
        <div className="h-32 animate-pulse rounded-[7px] bg-muted-warm" />
      </div>
    </div>
  );
}
