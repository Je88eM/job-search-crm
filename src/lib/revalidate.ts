import "server-only";
import { revalidatePath } from "next/cache";

/**
 * Call after every save. Clears the cached copies of ALL pages (in the browser and on the server),
 * not just the current one, because one save can change other tabs: logging an activity on an
 * application shows on its company and contact; moving to Applied creates a task.
 */
export function revalidateApp() {
  revalidatePath("/", "layout");
}
