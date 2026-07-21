import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { LogOut, Search, ShieldCheck, Mail, Calendar, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePortal } from "@/lib/portal-store";

export const Route = createFileRoute("/client")({
  component: ClientPortal,
});

function ClientPortal() {
  const portal = usePortal();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [templateId, setTemplateId] = useState<string>("all");

  useEffect(() => {
    if (portal.role !== "client" && portal.role !== "admin") navigate({ to: "/" });
  }, [portal.role, navigate]);

  const filtered = useMemo(() => {
    return portal.candidates.filter((c) => {
      if (templateId !== "all" && c.templateId !== templateId) return false;
      if (!query.trim()) return true;
      const q = query.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        Object.values(c.data).some((v) => String(v).toLowerCase().includes(q))
      );
    });
  }, [portal.candidates, query, templateId]);

  const templateName = (id: string) =>
    portal.templates.find((t) => t.id === id)?.name ?? "Untitled Role";

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/80 backdrop-blur">
        <div className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-md bg-zinc-900 flex items-center justify-center">
              <ShieldCheck className="h-3.5 w-3.5 text-zinc-50" />
            </div>
            <span className="text-sm font-semibold tracking-tight text-zinc-900">Talent Portal</span>
            <Badge variant="secondary" className="ml-2 bg-zinc-100 text-zinc-600 hover:bg-zinc-100">
              Client
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              portal.logout();
              navigate({ to: "/" });
            }}
            className="text-zinc-600"
          >
            <LogOut className="h-4 w-4 mr-2" /> Sign out
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-10">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-400 mb-2">
              Candidate Gallery
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
              Shortlisted Talent
            </h1>
            <p className="mt-1 text-sm text-zinc-500">
              Review candidates curated across your active engagements.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <Input
                placeholder="Search candidates..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-9 h-10 w-full sm:w-72 border-zinc-200 bg-white"
              />
            </div>
            <Select value={templateId} onValueChange={setTemplateId}>
              <SelectTrigger className="h-10 w-full sm:w-56 border-zinc-200 bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                {portal.templates.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-200 bg-white p-16 text-center">
            <Sparkles className="h-6 w-6 mx-auto text-zinc-300" />
            <p className="mt-3 text-sm text-zinc-500">No candidates match your search.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((c) => {
              const template = portal.templates.find((t) => t.id === c.templateId);
              return (
                <div
                  key={c.id}
                  className="group rounded-2xl border border-zinc-200 bg-white p-6 transition-all hover:border-zinc-300 hover:shadow-[0_4px_20px_-8px_rgba(0,0,0,0.08)]"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-11 w-11 rounded-full bg-gradient-to-br from-zinc-900 to-zinc-600 text-zinc-50 flex items-center justify-center text-sm font-medium">
                        {c.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2)}
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-zinc-900 leading-tight">
                          {c.name}
                        </h3>
                        <p className="text-xs text-zinc-500 mt-0.5">{templateName(c.templateId)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 space-y-2 text-xs text-zinc-600">
                    <div className="flex items-center gap-2">
                      <Mail className="h-3.5 w-3.5 text-zinc-400" />
                      <span className="truncate">{c.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5 text-zinc-400" />
                      <span>Applied {c.appliedAt}</span>
                    </div>
                  </div>

                  {template && template.fields.length > 0 && (
                    <div className="mt-5 pt-5 border-t border-zinc-100 space-y-2">
                      {template.fields.slice(0, 4).map((f) => {
                        const v = c.data[f.key];
                        if (v === undefined || v === null || v === "") return null;
                        return (
                          <div key={f.id} className="flex items-center justify-between text-xs">
                            <span className="text-zinc-500">{f.label}</span>
                            <span className="font-medium text-zinc-900">
                              {typeof v === "boolean" ? (v ? "Yes" : "No") : String(v)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}