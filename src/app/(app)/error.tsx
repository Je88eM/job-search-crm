"use client";

import { Button } from "@/components/ui/button";

// Shown if a page fails to load (e.g. the database is unreachable).
// Deliberately generic: no error details or stack traces reach the screen.
export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex flex-col items-start gap-3">
      <h1 className="text-xl font-semibold">Something went wrong</h1>
      <p className="text-sm text-muted-foreground">This page couldn&apos;t load. Check your connection and try again.</p>
      <Button variant="outline" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}
