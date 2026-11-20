import { Suspense } from "react";
import { LogOut } from "lucide-react";
import { logout } from "@/app/login/actions";
import { SidebarNav } from "@/components/app/sidebar-nav";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

// The sidebar is static and renders instantly. Anything that reads the session
// (the signed-in email, and each page's data) streams in behind a <Suspense> boundary,
// as Next.js 16 Cache Components require.
export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-screen">
      <aside className="flex w-56 shrink-0 flex-col border-r bg-muted/30 p-3">
        <div className="px-2.5 pb-4 pt-1 text-sm font-semibold">Job Search CRM</div>
        <SidebarNav />
        <div className="mt-auto flex flex-col gap-2 border-t pt-3">
          <Suspense fallback={<p className="px-2.5 text-xs text-muted-foreground">...</p>}>
            <SignedInEmail />
          </Suspense>
          <form action={logout}>
            <Button type="submit" variant="ghost" size="sm" className="w-full justify-start">
              <LogOut />
              Sign out
            </Button>
          </form>
        </div>
      </aside>
      <main className="flex-1 overflow-x-auto p-8">
        <Suspense fallback={<p className="text-sm text-muted-foreground">Loading...</p>}>
          {children}
        </Suspense>
      </main>
    </div>
  );
}

async function SignedInEmail() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <p className="truncate px-2.5 text-xs text-muted-foreground" title={user?.email ?? ""}>
      {user?.email}
    </p>
  );
}
