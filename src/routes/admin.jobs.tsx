import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Briefcase, Users, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { usePortal, type FormTemplate, type TemplateField } from "@/lib/portal-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/jobs")({
  component: JobsPage,
});

function JobsPage() {
  const portal = usePortal();
  const [selectedId, setSelectedId] = useState<string | null>(portal.templates[0]?.id ?? null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const selected = portal.templates.find((t) => t.id === selectedId) ?? null;
  const candidates = useMemo(
    () => portal.candidates.filter((c) => c.templateId === selectedId),
    [portal.candidates, selectedId],
  );

  return (
    <div className="flex h-screen">
      {/* Jobs list */}
      <div className="w-80 shrink-0 border-r border-zinc-200 bg-white flex flex-col">
        <div className="p-6 border-b border-zinc-200">
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-400">Active</p>
          <h2 className="mt-1 text-lg font-semibold tracking-tight text-zinc-900">Job Roles</h2>
        </div>
        <div className="flex-1 overflow-auto p-3 space-y-1">
          {portal.templates.map((t) => {
            const count = portal.candidates.filter((c) => c.templateId === t.id).length;
            const active = selectedId === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setSelectedId(t.id)}
                className={cn(
                  "w-full text-left p-3 rounded-lg border transition-all group",
                  active
                    ? "border-zinc-900 bg-zinc-50"
                    : "border-transparent hover:bg-zinc-50",
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-zinc-900 truncate">
                      {t.name || "Untitled"}
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-zinc-500">
                      <Users className="h-3 w-3" />
                      <span>
                        {count} candidate{count === 1 ? "" : "s"}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </button>
            );
          })}
          {portal.templates.length === 0 && (
            <p className="text-xs text-zinc-400 p-4 text-center">
              Create a form template first
            </p>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 min-w-0 overflow-auto">
        {!selected ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <Briefcase className="h-8 w-8 mx-auto text-zinc-300" />
              <p className="mt-3 text-sm text-zinc-500">Select a job to manage candidates</p>
            </div>
          </div>
        ) : (
          <div className="p-10">
            <div className="flex items-center justify-between mb-8">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-zinc-400 mb-2">
                  Candidate Roster
                </p>
                <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
                  {selected.name}
                </h1>
                {selected.description && (
                  <p className="mt-1 text-sm text-zinc-500">{selected.description}</p>
                )}
              </div>
              <Button
                onClick={() => setDrawerOpen(true)}
                className="bg-zinc-900 hover:bg-zinc-800 text-zinc-50"
              >
                <Plus className="h-4 w-4 mr-2" /> Add Candidate
              </Button>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-zinc-200 hover:bg-transparent">
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                      Name
                    </TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                      Email
                    </TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                      Applied
                    </TableHead>
                    {selected.fields.map((f) => (
                      <TableHead
                        key={f.id}
                        className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500"
                      >
                        {f.label}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {candidates.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={3 + selected.fields.length}
                        className="text-center py-16 text-sm text-zinc-500"
                      >
                        No candidates yet. Click "Add Candidate" to get started.
                      </TableCell>
                    </TableRow>
                  ) : (
                    candidates.map((c) => (
                      <TableRow key={c.id} className="border-zinc-100">
                        <TableCell className="font-medium text-zinc-900">{c.name}</TableCell>
                        <TableCell className="text-zinc-600">{c.email}</TableCell>
                        <TableCell className="text-zinc-600">{c.appliedAt}</TableCell>
                        {selected.fields.map((f) => {
                          const v = c.data[f.key];
                          return (
                            <TableCell key={f.id} className="text-zinc-700">
                              {v === undefined || v === null || v === ""
                                ? "—"
                                : typeof v === "boolean"
                                  ? v
                                    ? "Yes"
                                    : "No"
                                  : String(v)}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </div>

      {selected && (
        <AddCandidateDrawer
          open={drawerOpen}
          onOpenChange={setDrawerOpen}
          template={selected}
        />
      )}
    </div>
  );
}

function buildSchema(fields: TemplateField[]) {
  const shape: Record<string, z.ZodTypeAny> = {
    name: z.string().trim().min(1, "Name is required").max(100),
    email: z.string().trim().email("Enter a valid email").max(255),
  };

  for (const f of fields) {
    let s: z.ZodTypeAny;
    switch (f.type) {
      case "number":
        s = z.preprocess(
          (v) => (v === "" || v === undefined || v === null ? undefined : Number(v)),
          f.required
            ? z.number({ invalid_type_error: "Enter a number" })
            : z.number({ invalid_type_error: "Enter a number" }).optional(),
        );
        break;
      case "checkbox":
        s = z.boolean().default(false);
        break;
      case "select":
        s = f.required
          ? z.string().min(1, `${f.label} is required`)
          : z.string().optional();
        break;
      default:
        s = f.required
          ? z.string().trim().min(1, `${f.label} is required`).max(500)
          : z.string().trim().max(500).optional();
    }
    shape[f.key] = s;
  }
  return z.object(shape);
}

/**
 * Build a database-ready candidate payload from validated form values.
 * Matches the Prisma `Candidate` model:
 *   { jobId, name, email, data: Json }
 * where `data` is keyed by each FormField's `name` (TemplateField.key).
 */
export type CandidatePayload = {
  jobId: string;
  name: string;
  email: string;
  data: Record<string, string | number | boolean | null>;
};

export function buildCandidatePayload(
  template: FormTemplate,
  values: Record<string, unknown>,
): CandidatePayload {
  const { name, email, ...rest } = values;
  const data: Record<string, string | number | boolean | null> = {};

  for (const f of template.fields) {
    const v = rest[f.key];
    if (v === undefined || v === "" || v === null) {
      data[f.key] = null;
      continue;
    }
    if (f.type === "number") {
      const n = typeof v === "number" ? v : Number(v);
      data[f.key] = Number.isNaN(n) ? null : n;
    } else if (f.type === "checkbox") {
      data[f.key] = Boolean(v);
    } else {
      data[f.key] = String(v);
    }
  }

  return {
    jobId: template.id,
    name: String(name ?? "").trim(),
    email: String(email ?? "").trim(),
    data,
  };
}

function AddCandidateDrawer({
  open,
  onOpenChange,
  template,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  template: FormTemplate;
}) {
  const schema = useMemo(() => buildSchema(template.fields), [template]);
  type FormValues = z.infer<typeof schema>;

  const defaultValues = useMemo(() => {
    const dv: Record<string, unknown> = { name: "", email: "" };
    for (const f of template.fields) {
      dv[f.key] = f.type === "checkbox" ? false : "";
    }
    return dv as FormValues;
  }, [template]);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const onSubmit = (values: FormValues) => {
    const payload = buildCandidatePayload(template, values as Record<string, unknown>);
    // Database-ready object shaped for Prisma `Candidate.create({ data: payload })`
    console.log("Candidate payload:", payload);
    toast.success(`${payload.name} added to ${template.name}`);
    form.reset(defaultValues);
    onOpenChange(false);
    return payload;
  };

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) form.reset(defaultValues);
      }}
    >
      <SheetContent className="sm:max-w-lg overflow-y-auto p-0 flex flex-col">
        <SheetHeader className="p-6 border-b border-zinc-200">
          <SheetTitle className="text-xl tracking-tight">Add Candidate</SheetTitle>
          <SheetDescription>
            Adding to <span className="font-medium text-zinc-900">{template.name}</span>
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex-1 flex flex-col"
          >
            <div className="flex-1 p-6 space-y-5">
              <FormField
                control={form.control}
                name={"name" as never}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                      Full Name
                    </FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Jane Doe" className="border-zinc-200" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={"email" as never}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                      Email
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        placeholder="jane@example.com"
                        className="border-zinc-200"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {template.fields.length > 0 && (
                <div className="pt-2">
                  <div className="flex items-center gap-2 mb-4">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                      Custom Fields
                    </p>
                    <div className="h-px flex-1 bg-zinc-100" />
                  </div>
                  <div className="space-y-5">
                    {template.fields.map((f) => (
                      <DynamicField key={f.id} form={form} field={f} />
                    ))}
                  </div>
                </div>
              )}
            </div>

            <SheetFooter className="p-6 border-t border-zinc-200 bg-zinc-50/50">
              <div className="flex gap-2 w-full">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="flex-1 border-zinc-200"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-50"
                >
                  Add Candidate
                </Button>
              </div>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}

function DynamicField({
  form,
  field,
}: {
  form: ReturnType<typeof useForm<any>>;
  field: TemplateField;
}) {
  if (field.type === "checkbox") {
    return (
      <FormField
        control={form.control}
        name={field.key}
        render={({ field: f }) => (
          <FormItem>
            <FormControl>
              <label className="flex items-start gap-3 rounded-lg border border-zinc-200 bg-white p-4 cursor-pointer hover:border-zinc-300 transition-colors">
                <Checkbox
                  checked={!!f.value}
                  onCheckedChange={f.onChange}
                  className="mt-0.5"
                />
                <div className="flex-1">
                  <span className="text-sm font-medium text-zinc-900">{field.label}</span>
                  {field.required && (
                    <span className="ml-1 text-xs text-zinc-400">(required)</span>
                  )}
                </div>
              </label>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    );
  }

  if (field.type === "select") {
    return (
      <FormField
        control={form.control}
        name={field.key}
        render={({ field: f }) => (
          <FormItem>
            <FormLabel className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              {field.label}
              {field.required && <span className="text-zinc-400 ml-1">*</span>}
            </FormLabel>
            <Select value={f.value ?? ""} onValueChange={f.onChange}>
              <FormControl>
                <SelectTrigger className="border-zinc-200">
                  <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {(field.options ?? []).map((opt) => (
                  <SelectItem key={opt} value={opt}>
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
    );
  }

  return (
    <FormField
      control={form.control}
      name={field.key}
      render={({ field: f }) => (
        <FormItem>
          <FormLabel className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            {field.label}
            {field.required && <span className="text-zinc-400 ml-1">*</span>}
          </FormLabel>
          <FormControl>
            <Input
              {...f}
              type={field.type === "number" ? "number" : "text"}
              className="border-zinc-200"
              placeholder={field.type === "number" ? "0" : `Enter ${field.label.toLowerCase()}`}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}