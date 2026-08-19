"use client";

import { formatRelative } from "@/lib/format";

// Client components re-run formatRelative() on hydration with a fresh
// Date.now(), which can render a different string than the server did a
// moment earlier ("há 32 segundos" vs "há 33 segundos") — suppress the
// resulting (harmless) hydration warning instead of fighting the clock.
export function RelativeTime({ iso }: { iso: string | null | undefined }) {
  return <span suppressHydrationWarning>{formatRelative(iso)}</span>;
}
