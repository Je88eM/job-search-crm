// Shown while a tab's data loads. Each route has a loading.tsx that renders this,
// so switching tabs shows the new page's skeleton instantly instead of waiting.
export function PageLoading() {
  return (
    <div className="flex animate-pulse flex-col gap-4" aria-busy="true" aria-label="Loading">
      <div className="h-7 w-40 rounded-md bg-muted" />
      <div className="h-8 w-80 rounded-md bg-muted" />
      <div className="h-64 rounded-lg bg-muted/60" />
    </div>
  );
}
