"use client";

import { useTransition } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { completeFollowupAction } from "@/lib/actions/followups";

export function CompleteFollowupButton({ id, size = "sm" }: { id: string; size?: "sm" | "default" }) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      size={size}
      variant="outline"
      disabled={pending}
      onClick={() => startTransition(() => completeFollowupAction(id))}
    >
      <Check className="h-3.5 w-3.5" />
      {pending ? "Concluindo…" : "Concluir"}
    </Button>
  );
}
