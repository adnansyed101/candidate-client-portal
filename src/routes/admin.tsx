import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { FileText, Briefcase, LogOut, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { usePortal } from "@/lib/portal-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

const NAV = [
  { to: "/admin/templates", label: "Form Templates", icon: FileText },
  { to: "/admin/jobs", label: "Jobs & Candidates", icon: Briefcase },
] as const;

function AdminLayout() {
  const portal = usePortal();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (portal.role !== "admin") navigate({ to: "/" });
  }, [portal.role, navigate]);

  useEffect(() => {
    if (pathname === "/admin") navigate({ to: "/admin/templates", replace: true });
  }, [pathname, navigate]);

  return (
    <div className="min-h-screen bg-zinc-50 flex">
      <aside className="w-64 shrink-0 border-r border-zinc-200 bg-white flex flex-col">
        <div className="h-16 flex items-center gap-2 px-6 border-b border-zinc-200">
          <div className="h-7 w-7 rounded-md bg-zinc-900 flex items-center justify-center">
            <ShieldCheck className="h-3.5 w-3.5 text-zinc-50" />
          </div>
          <span className="text-sm font-semibold tracking-tight text-zinc-900">Talent Portal</span>
        </div>
        <div className="px-3 py-4">
          <p className="px-3 text-[10px] font-semibold uppercase tracking-wider text-zinc-400 mb-2">
            Workspace
          </p>
          <nav className="space-y-1">
            {NAV.map((item) => {
              const active = pathname.startsWith(item.to);
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors",
                    active
                      ? "bg-zinc-900 text-zinc-50"
                      : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="mt-auto p-4 border-t border-zinc-200">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-zinc-900 to-zinc-600 text-zinc-50 flex items-center justify-center text-xs font-medium">
              {(portal.user ?? "A").slice(0, 1).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-zinc-900 truncate">{portal.user ?? "Admin"}</p>
              <Badge variant="secondary" className="h-4 text-[10px] px-1.5 bg-zinc-100 text-zinc-600">
                Admin
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-zinc-500"
              onClick={() => {
                portal.logout();
                navigate({ to: "/" });
              }}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </aside>

      <main className="flex-1 min-w-0">
        <Outlet />
      </main>
    </div>
  );
}