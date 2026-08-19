"use server";

import { revalidatePath } from "next/cache";
import * as store from "@/lib/data/store";

export async function completeFollowupAction(id: string) {
  await store.completeFollowup(id);
  revalidatePath("/followups");
  revalidatePath("/dashboard");
}
