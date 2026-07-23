import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Briefcase, Users, ChevronRight, Eye, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  MultiSelect,
  MultiSelectTrigger,
  MultiSelectValue,
  MultiSelectContent,
  MultiSelectItem,
} from '@/components/ui/multi-select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/lib/utils'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  type Candidate,
  type FormTemplate,
  type TemplateField,
  PrismaJobSchema,
  PrismaCandidateSchema,
  prismaJobToFormTemplate,
  prismaCandidateToAppCandidate,
  buildCandidateFormSchema,
  buildCandidatePayload,
} from '@/lib/schemas'

export const Route = createFileRoute('/admin/jobs')({
  component: JobsPage,
})

function JobsPage() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [viewCandidate, setViewCandidate] = useState<Candidate | null>(null)

  const dbTemplates = useQuery({
    queryKey: ['templates'],
    queryFn: async (): Promise<FormTemplate[]> => {
      const response = await fetch('/api/template')
      const json = await response.json()
      if (!json.success)
        throw new Error(json.message ?? 'Failed to fetch templates')
      const jobs = z.array(PrismaJobSchema).parse(json.data)
      return jobs.map(prismaJobToFormTemplate)
    },
  })

  const candidatesQuery = useQuery({
    queryKey: ['candidates', selectedId],
    queryFn: async (): Promise<Candidate[]> => {
      const response = await fetch(`/api/candidates?jobId=${selectedId}`)
      const json = await response.json()
      if (!json.success)
        throw new Error(json.message ?? 'Failed to fetch candidates')
      const prismaCandidates = z.array(PrismaCandidateSchema).parse(json.data)
      return prismaCandidates.map(prismaCandidateToAppCandidate)
    },
    enabled: !!selectedId,
  })

  const deleteCandidateMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/candidates?id=${id}`, {
        method: 'DELETE',
      })
      const json = await response.json()
      if (!json.success)
        throw new Error(json.message ?? 'Failed to delete candidate')
      return json
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidates', selectedId] })
    },
  })

  const queryClient = useQueryClient()

  const templates = dbTemplates.data

  useEffect(() => {
    if (templates && templates.length > 0 && !selectedId) {
      setSelectedId(templates[0].id)
    }
  }, [templates, selectedId])

  const selected = templates?.find((t) => t.id === selectedId) ?? null
  const candidates = candidatesQuery.data ?? []

  if (dbTemplates.isLoading || dbTemplates.isPending) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner className="size-8 text-zinc-400" />
      </div>
    )
  }

  if (dbTemplates.isError) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-sm text-zinc-500">Failed to load templates.</p>
      </div>
    )
  }

  return (
    <div className="flex h-screen">
      {/* Jobs list */}
      <div className="w-80 shrink-0 border-r border-zinc-200 bg-white flex flex-col">
        <div className="p-6 border-b border-zinc-200">
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-400">
            Active
          </p>
          <h2 className="mt-1 text-lg font-semibold tracking-tight text-zinc-900">
            Job Roles
          </h2>
        </div>
        <div className="flex-1 overflow-auto p-3 space-y-1">
          {templates?.map((t) => {
            const active = selectedId === t.id
            return (
              <button
                key={t.id}
                onClick={() => setSelectedId(t.id)}
                className={cn(
                  'w-full text-left p-3 rounded-lg border transition-all group',
                  active
                    ? 'border-zinc-900 bg-zinc-50'
                    : 'border-transparent hover:bg-zinc-50',
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-zinc-900 truncate">
                      {t.name || 'Untitled'}
                    </p>
                    {active && candidatesQuery.data && (
                      <div className="flex items-center gap-2 mt-1 text-xs text-zinc-500">
                        <Users className="h-3 w-3" />
                        <span>
                          {candidates.length} candidate
                          {candidates.length === 1 ? '' : 's'}
                        </span>
                      </div>
                    )}
                  </div>
                  <ChevronRight className="h-4 w-4 text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </button>
            )
          })}
          {templates?.length === 0 && (
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
              <p className="mt-3 text-sm text-zinc-500">
                Select a job to manage candidates
              </p>
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
                  <p className="mt-1 text-sm text-zinc-500">
                    {selected.description}
                  </p>
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
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 w-24">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {candidatesQuery.isLoading || candidatesQuery.isPending ? (
                    <TableRow>
                      <TableCell
                        colSpan={4 + selected.fields.length}
                        className="text-center py-16"
                      >
                        <Spinner className="size-5 text-zinc-400 mx-auto" />
                      </TableCell>
                    </TableRow>
                  ) : candidates.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={4 + selected.fields.length}
                        className="text-center py-16 text-sm text-zinc-500"
                      >
                        No candidates yet. Click "Add Candidate" to get started.
                      </TableCell>
                    </TableRow>
                  ) : (
                    candidates.map((c) => (
                      <TableRow key={c.id} className="border-zinc-100">
                        <TableCell className="font-medium text-zinc-900">
                          {c.name}
                        </TableCell>
                        <TableCell className="text-zinc-600">
                          {c.email}
                        </TableCell>
                        <TableCell className="text-zinc-600">
                          {c.appliedAt}
                        </TableCell>
                        {selected.fields.map((f) => {
                          const v = c.data[f.key]
                          return (
                            <TableCell key={f.id} className="text-zinc-700">
                              {v === undefined || v === null || v === ''
                                ? '—'
                                : typeof v === 'boolean'
                                  ? v
                                    ? 'Yes'
                                    : 'No'
                                  : Array.isArray(v)
                                    ? v.join(', ')
                                    : String(v)}
                            </TableCell>
                          )
                        })}
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-zinc-500"
                              onClick={() => setViewCandidate(c)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-zinc-500 hover:text-red-600"
                              disabled={deleteCandidateMutation.isPending}
                              onClick={() => {
                                deleteCandidateMutation.mutate(c.id, {
                                  onSuccess: () => toast.success(`${c.name} removed`),
                                })
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
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
          onCandidateAdded={() =>
            queryClient.invalidateQueries({ queryKey: ['candidates'] })
          }
        />
      )}

      <CandidateDetailsDialog
        candidate={viewCandidate}
        onOpenChange={(open) => {
          if (!open) setViewCandidate(null)
        }}
      />
    </div>
  )
}

function AddCandidateDrawer({
  open,
  onOpenChange,
  template,
  onCandidateAdded,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  template: FormTemplate
  onCandidateAdded?: () => void
}) {
  const schema = useMemo(
    () => buildCandidateFormSchema(template.fields),
    [template],
  )
  type FormValues = z.infer<typeof schema>

  const defaultValues = useMemo(() => {
    const dv: Record<string, unknown> = { name: '', email: '' }
    for (const f of template.fields) {
      dv[f.key] = f.type === 'checkbox' ? false : ''
    }
    return dv as FormValues
  }, [template])

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues,
  })

  const mutation = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const response = await fetch('/api/candidates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await response.json()
      if (!json.success)
        throw new Error(json.message ?? 'Failed to add candidate')
      return json
    },
    onSuccess: (_data, variables) => {
      toast.success(`${variables.name} added to ${template.name}`)
      form.reset(defaultValues)
      onOpenChange(false)
      onCandidateAdded?.()
    },
    onError: (err: any) => {
      toast.error(err.message ?? 'Failed to add candidate')
    },
  })

  const onSubmit = (values: FormValues) => {
    const payload = buildCandidatePayload(
      template,
      values as Record<string, unknown>,
    )
    mutation.mutate(payload)
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o)
        if (!o) form.reset(defaultValues)
      }}
    >
      <SheetContent className="sm:max-w-lg overflow-y-auto p-0 flex flex-col">
        <SheetHeader className="p-6 border-b border-zinc-200">
          <SheetTitle className="text-xl tracking-tight">
            Add Candidate
          </SheetTitle>
          <SheetDescription>
            Adding to{' '}
            <span className="font-medium text-zinc-900">{template.name}</span>
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
                name={'name' as never}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                      Full Name
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Jane Doe"
                        className="border-zinc-200"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={'email' as never}
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
                  disabled={mutation.isPending}
                  className="flex-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-50"
                >
                  {mutation.isPending ? 'Adding...' : 'Add Candidate'}
                </Button>
              </div>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  )
}

function CandidateDetailsDialog({
  candidate,
  onOpenChange,
}: {
  candidate: Candidate | null
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Dialog open={!!candidate} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{candidate?.name ?? 'Candidate'}</DialogTitle>
          <DialogDescription>
            {candidate?.email}
          </DialogDescription>
        </DialogHeader>
        {candidate && (
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
              <span className="text-zinc-500">Applied</span>
              <span className="font-medium text-zinc-900">{candidate.appliedAt}</span>
            </div>
            {Object.entries(candidate.data).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between border-b border-zinc-100 pb-2">
                <span className="text-zinc-500 capitalize">{key.replace(/_/g, ' ')}</span>
                <span className="font-medium text-zinc-900">
                  {value === null || value === undefined || value === ''
                    ? '—'
                    : typeof value === 'boolean'
                      ? value
                        ? 'Yes'
                        : 'No'
                      : Array.isArray(value)
                        ? value.join(', ')
                        : String(value)}
                </span>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

function DynamicField({
  form,
  field,
}: {
  form: ReturnType<typeof useForm<Record<string, unknown>>>
  field: TemplateField
}) {
  if (field.type === 'checkbox') {
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
                  <span className="text-sm font-medium text-zinc-900">
                    {field.label}
                  </span>
                  {field.required && (
                    <span className="ml-1 text-xs text-zinc-400">
                      (required)
                    </span>
                  )}
                </div>
              </label>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    )
  }

  if (field.type === 'select') {
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
            <Select value={String(f.value ?? '')} onValueChange={f.onChange}>
              <FormControl>
                <SelectTrigger className="border-zinc-200">
                  <SelectValue
                    placeholder={`Select ${field.label.toLowerCase()}`}
                  />
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
    )
  }

  if (field.type === 'multi-select') {
    const values = Array.isArray(form.watch(field.key))
      ? (form.watch(field.key) as string[])
      : []
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
              <MultiSelect
                values={values}
                onValuesChange={(v) => f.onChange(v)}
              >
                <MultiSelectTrigger className="w-full border-zinc-200">
                  <MultiSelectValue
                    placeholder={`Select ${field.label.toLowerCase()}`}
                  />
                </MultiSelectTrigger>
                <MultiSelectContent>
                  {(field.options ?? []).map((opt) => (
                    <MultiSelectItem key={opt} value={opt} badgeLabel={opt}>
                      {opt}
                    </MultiSelectItem>
                  ))}
                </MultiSelectContent>
              </MultiSelect>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    )
  }

  if (field.type === 'textarea') {
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
              <Textarea
                {...f}
                value={f.value as string}
                className="border-zinc-200 min-h-24"
                placeholder={`Enter ${field.label.toLowerCase()}`}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    )
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
              value={f.value as string}
              type={
                field.type === 'number'
                  ? 'number'
                  : field.type === 'calendar'
                    ? 'date'
                    : 'text'
              }
              className="border-zinc-200"
              placeholder={
                field.type === 'number'
                  ? '0'
                  : field.type === 'calendar'
                    ? 'Select a date'
                    : `Enter ${field.label.toLowerCase()}`
              }
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
