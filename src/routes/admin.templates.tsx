import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import {
  Plus,
  Trash2,
  GripVertical,
  Save,
  FileText,
  X,
  ChevronRight,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { z } from 'zod'
import { cn } from '@/lib/utils'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  type FieldType,
  type TemplateField,
  type FormTemplate,
  type JobTemplatePayload,
  PrismaJobSchema,
  prismaJobToFormTemplate,
  buildTemplatePayload,
} from '@/lib/schemas'

// To anyone who will work in this file. The code is generated using lovable/ai. The conditions where the admin can create the form fields dynamically. I do not know how to do this. For which I used lovable. So use this only to create the form field.

export const Route = createFileRoute('/admin/templates')({
  component: TemplatesBuilder,
})



function uid(prefix = 'id') {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`
}

const emptyTemplate = (): FormTemplate => ({
  id: uid('tpl'),
  name: '',
  description: '',
  fields: [],
  createdAt: new Date().toISOString(),
})

function TemplatesBuilder() {
  const queryClient = useQueryClient()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [draft, setDraft] = useState<FormTemplate | null>(null)

  const templatesQuery = useQuery({
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

  const templates = templatesQuery.data ?? []

  useEffect(() => {
    if (templates.length > 0 && !selectedId) {
      setSelectedId(templates[0].id)
      setDraft(JSON.parse(JSON.stringify(templates[0])))
    }
  }, [templates, selectedId])

  const createTemplateMutation = useMutation({
    mutationKey: ['createTemplate'],
    mutationFn: async (newJob: JobTemplatePayload) => {
      const response = await fetch('/api/template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newJob),
      })
      const json = await response.json()
      if (!json.success)
        throw new Error(json.message ?? 'Failed to create template')
      return json
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] })
    },
  })

  const updateTemplateMutation = useMutation({
    mutationKey: ['updateTemplate'],
    mutationFn: async (payload: JobTemplatePayload & { id: string }) => {
      const response = await fetch('/api/template', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await response.json()
      if (!json.success)
        throw new Error(json.message ?? 'Failed to update template')
      return json
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] })
    },
  })

  const deleteTemplateMutation = useMutation({
    mutationKey: ['deleteTemplate'],
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/template?id=${id}`, {
        method: 'DELETE',
      })
      const json = await response.json()
      if (!json.success)
        throw new Error(json.message ?? 'Failed to delete template')
      return json
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] })
    },
  })

  const selectTemplate = (t: FormTemplate) => {
    setSelectedId(t.id)
    setDraft(JSON.parse(JSON.stringify(t)))
  }

  const startNew = () => {
    const t = emptyTemplate()
    setSelectedId(t.id)
    setDraft(t)
  }

  const updateDraft = (patch: Partial<FormTemplate>) =>
    setDraft((d) => (d ? { ...d, ...patch } : d))

  const updateField = (fid: string, patch: Partial<TemplateField>) =>
    setDraft((d) =>
      d
        ? {
            ...d,
            fields: d.fields.map((f) =>
              f.id === fid ? { ...f, ...patch } : f,
            ),
          }
        : d,
    )

  const addField = () =>
    setDraft((d) =>
      d
        ? {
            ...d,
            fields: [
              ...d.fields,
              {
                id: uid('f'),
                label: '',
                key: '',
                type: 'text',
                required: false,
              },
            ],
          }
        : d,
    )

  const removeField = (fid: string) =>
    setDraft((d) =>
      d ? { ...d, fields: d.fields.filter((f) => f.id !== fid) } : d,
    )

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e
    if (!over || active.id === over.id) return
    setDraft((d) => {
      if (!d) return d
      const oldIndex = d.fields.findIndex((f) => f.id === active.id)
      const newIndex = d.fields.findIndex((f) => f.id === over.id)
      if (oldIndex < 0 || newIndex < 0) return d
      return { ...d, fields: arrayMove(d.fields, oldIndex, newIndex) }
    })
  }

  const save = () => {
    if (!draft) return
    if (!draft.name.trim()) {
      toast.error('Template name is required')
      return
    }
    const keys = draft.fields.map((f) => f.key.trim())
    if (keys.some((k) => !k)) {
      toast.error('All fields require a unique key')
      return
    }
    if (new Set(keys).size !== keys.length) {
      toast.error('Field keys must be unique')
      return
    }
    const payload = buildTemplatePayload(draft)
    const isUpdate = templates.some((t) => t.id === draft.id)

    if (isUpdate) {
      updateTemplateMutation.mutate(
        { ...payload, id: draft.id },
        {
          onSuccess: () => {
            toast.success(`Template "${draft.name}" updated`)
          },
        },
      )
    } else {
      createTemplateMutation.mutate(payload, {
        onSuccess: () => {
          toast.success(`Template "${draft.name}" created`)
        },
      })
    }
    return payload
  }

  return (
    <div className="flex h-screen">
      {/* Template list */}
      <div className="w-80 shrink-0 border-r border-zinc-200 bg-white flex flex-col">
        <div className="p-6 border-b border-zinc-200">
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-400">
            Library
          </p>
          <h2 className="mt-1 text-lg font-semibold tracking-tight text-zinc-900">
            Form Templates
          </h2>
          <Button
            onClick={startNew}
            size="sm"
            className="mt-4 w-full bg-zinc-900 hover:bg-zinc-800 text-zinc-50"
          >
            <Plus className="h-4 w-4 mr-2" /> New Template
          </Button>
        </div>
        <div className="flex-1 overflow-auto p-3 space-y-1">
          {templatesQuery.isLoading ? (
            <p className="text-xs text-zinc-400 p-4 text-center">Loading...</p>
          ) : (
            templates.map((t) => (
              <button
                key={t.id}
                onClick={() => selectTemplate(t)}
                className={cn(
                  'w-full text-left p-3 rounded-lg border transition-all group',
                  selectedId === t.id
                    ? 'border-zinc-900 bg-zinc-50'
                    : 'border-transparent hover:bg-zinc-50',
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-zinc-900 truncate">
                      {t.name || 'Untitled'}
                    </p>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      {t.fields.length} field{t.fields.length === 1 ? '' : 's'}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </button>
            ))
          )}
          {!templatesQuery.isLoading && templates.length === 0 && (
            <p className="text-xs text-zinc-400 p-4 text-center">
              No templates yet
            </p>
          )}
        </div>
      </div>

      {/* Builder */}
      <div className="flex-1 min-w-0 overflow-auto">
        {!draft ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <FileText className="h-8 w-8 mx-auto text-zinc-300" />
              <p className="mt-3 text-sm text-zinc-500">
                Select a template or create a new one
              </p>
            </div>
          </div>
        ) : (
          <div className="max-w-7xl mx-auto p-10">
            <div className="flex items-center justify-between mb-8">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-zinc-400 mb-2">
                  Template Builder
                </p>
                <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
                  Configure Form Set
                </h1>
              </div>
              <div className="flex gap-2">
                {templates.some((t) => t.id === draft.id) && (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={deleteTemplateMutation.isPending}
                    onClick={() => {
                      deleteTemplateMutation.mutate(draft.id, {
                        onSuccess: () => {
                          setDraft(null)
                          setSelectedId(null)
                          toast.success('Template deleted')
                        },
                      })
                    }}
                    className="border-zinc-200 text-zinc-600"
                  >
                    <Trash2 className="h-4 w-4 mr-2" /> Delete
                  </Button>
                )}
                <Button
                  size="sm"
                  onClick={save}
                  className="bg-zinc-900 hover:bg-zinc-800 text-zinc-50"
                >
                  <Save className="h-4 w-4 mr-2" /> Save Template
                </Button>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
              <div className="min-w-0">
                <div className="rounded-2xl border border-zinc-200 bg-white p-6 mb-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                        Template Name
                      </Label>
                      <Input
                        value={draft.name}
                        onChange={(e) => updateDraft({ name: e.target.value })}
                        placeholder="e.g. Senior Backend Engineer"
                        className="border-zinc-200"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                        Description
                      </Label>
                      <Input
                        value={draft.description ?? ''}
                        onChange={(e) =>
                          updateDraft({ description: e.target.value })
                        }
                        placeholder="Optional context for this role"
                        className="border-zinc-200"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-semibold text-zinc-900">
                    Fields
                    <Badge
                      variant="secondary"
                      className="ml-2 bg-zinc-100 text-zinc-600"
                    >
                      {draft.fields.length}
                    </Badge>
                  </h2>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addField}
                    className="border-zinc-200"
                  >
                    <Plus className="h-4 w-4 mr-2" /> Add Field
                  </Button>
                </div>

                <div className="space-y-3">
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={onDragEnd}
                  >
                    <SortableContext
                      items={draft.fields.map((f) => f.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      {draft.fields.map((field, idx) => (
                        <FieldRow
                          key={field.id}
                          index={idx}
                          field={field}
                          onChange={(patch) => updateField(field.id, patch)}
                          onRemove={() => removeField(field.id)}
                        />
                      ))}
                    </SortableContext>
                  </DndContext>
                  {draft.fields.length === 0 && (
                    <div className="rounded-xl border border-dashed border-zinc-200 bg-white p-10 text-center">
                      <p className="text-sm text-zinc-500">
                        No custom fields yet.
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={addField}
                        className="mt-3 text-zinc-700"
                      >
                        <Plus className="h-4 w-4 mr-2" /> Add first field
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              <aside className="lg:sticky lg:top-10 lg:self-start">
                <FormPreview template={draft} />
              </aside>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function FieldRow({
  index,
  field,
  onChange,
  onRemove,
}: {
  index: number
  field: TemplateField
  onChange: (patch: Partial<TemplateField>) => void
  onRemove: () => void
}) {
  const [optionInput, setOptionInput] = useState('')
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: field.id,
  })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }
  const addOption = () => {
    const v = optionInput.trim()
    if (!v) return
    onChange({ options: [...(field.options ?? []), v] })
    setOptionInput('')
  }
  const removeOption = (i: number) =>
    onChange({ options: (field.options ?? []).filter((_, idx) => idx !== i) })

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'rounded-xl border border-zinc-200 bg-white p-5',
        isDragging && 'shadow-lg ring-1 ring-zinc-300 z-10 relative',
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex items-center gap-2 pt-2">
          <button
            type="button"
            {...attributes}
            {...listeners}
            aria-label="Drag to reorder"
            className="cursor-grab active:cursor-grabbing touch-none text-zinc-300 hover:text-zinc-600 transition-colors"
          >
            <GripVertical className="h-4 w-4" />
          </button>
          <span className="text-[11px] font-medium text-zinc-400 tabular-nums">
            {String(index + 1).padStart(2, '0')}
          </span>
        </div>

        <div className="flex-1 grid gap-3 sm:grid-cols-12">
          <div className="sm:col-span-4 space-y-1.5">
            <Label className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
              Label
            </Label>
            <Input
              value={field.label}
              onChange={(e) => onChange({ label: e.target.value })}
              placeholder="Years of Experience"
              className="h-9 border-zinc-200"
            />
          </div>
          <div className="sm:col-span-3 space-y-1.5">
            <Label className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
              Key
            </Label>
            <Input
              value={field.key}
              onChange={(e) =>
                onChange({
                  key: e.target.value.replace(/\s+/g, '_').toLowerCase(),
                })
              }
              placeholder="years_experience"
              className="h-9 border-zinc-200 font-mono text-xs"
            />
          </div>
          <div className="sm:col-span-3 space-y-1.5">
            <Label className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
              Type
            </Label>
            <Select
              value={field.type}
              onValueChange={(v) =>
                onChange({
                  type: v as FieldType,
                  options: v === 'select' ? (field.options ?? []) : undefined,
                })
              }
            >
              <SelectTrigger className="h-9 border-zinc-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text">Text</SelectItem>
                <SelectItem value="number">Number</SelectItem>
                <SelectItem value="select">Select</SelectItem>
                <SelectItem value="checkbox">Checkbox</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="sm:col-span-2 space-y-1.5">
            <Label className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
              Required
            </Label>
            <div className="h-9 flex items-center">
              <Switch
                checked={field.required}
                onCheckedChange={(v) => onChange({ required: v })}
              />
            </div>
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={onRemove}
          className="h-9 w-9 text-zinc-400 hover:text-red-600"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {field.type === 'select' && (
        <div className="mt-4 pt-4 border-t border-zinc-100">
          <Label className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
            Options
          </Label>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {(field.options ?? []).map((opt, i) => (
              <Badge
                key={i}
                variant="secondary"
                className="bg-zinc-100 text-zinc-700 hover:bg-zinc-100 pl-2.5 pr-1 py-1 gap-1"
              >
                {opt}
                <button
                  onClick={() => removeOption(i)}
                  className="ml-1 rounded-sm hover:bg-zinc-200 p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
          <div className="mt-2 flex gap-2">
            <Input
              value={optionInput}
              onChange={(e) => setOptionInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addOption()
                }
              }}
              placeholder="Add an option and press Enter"
              className="h-9 border-zinc-200"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={addOption}
              className="border-zinc-200 h-9"
            >
              Add
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

function FormPreview({ template }: { template: FormTemplate }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-linear-to-b from-white to-zinc-50 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-400">
            Live Preview
          </p>
          <h3 className="text-sm font-semibold text-zinc-900 mt-0.5">
            {template.name || 'Untitled template'}
          </h3>
        </div>
        <Badge
          variant="secondary"
          className="bg-zinc-900 text-zinc-50 hover:bg-zinc-900"
        >
          Preview
        </Badge>
      </div>

      {template.description && (
        <p className="text-xs text-zinc-500 mb-5 leading-relaxed">
          {template.description}
        </p>
      )}

      <form
        onSubmit={(e) => e.preventDefault()}
        className="space-y-4 rounded-xl border border-zinc-200 bg-white p-5"
      >
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-zinc-700">
            Name <span className="text-red-500">*</span>
          </Label>
          <Input placeholder="Jane Doe" className="h-9 border-zinc-200" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-zinc-700">
            Email <span className="text-red-500">*</span>
          </Label>
          <Input
            type="email"
            placeholder="jane@example.com"
            className="h-9 border-zinc-200"
          />
        </div>

        {template.fields.length > 0 && (
          <div className="pt-3 border-t border-zinc-100 space-y-4">
            {template.fields.map((f) => (
              <PreviewField key={f.id} field={f} />
            ))}
          </div>
        )}

        {template.fields.length === 0 && (
          <p className="pt-3 border-t border-zinc-100 text-xs text-zinc-400 text-center py-2">
            Add fields to see them here
          </p>
        )}

        <Button
          type="button"
          disabled
          className="w-full bg-zinc-900 hover:bg-zinc-900 text-zinc-50 h-9"
        >
          Submit Candidate
        </Button>
      </form>
    </div>
  )
}

function PreviewField({ field }: { field: TemplateField }) {
  const label = field.label || (
    <span className="text-zinc-400 italic">Untitled field</span>
  )
  const common = 'h-9 border-zinc-200 w-full'

  if (field.type === 'checkbox') {
    return (
      <label className="flex items-center gap-2 cursor-pointer">
        <Checkbox />
        <span className="text-xs font-medium text-zinc-700">
          {label}
          {field.required && <span className="text-red-500 ml-0.5">*</span>}
        </span>
      </label>
    )
  }

  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-zinc-700">
        {label}
        {field.required && <span className="text-red-500 ml-0.5">*</span>}
      </Label>
      {field.type === 'text' && (
        <Input placeholder={field.key || 'Enter value'} className={common} />
      )}
      {field.type === 'number' && (
        <Input type="number" placeholder="0" className={common} />
      )}
      {field.type === 'select' && (
        <Select>
          <SelectTrigger className={common}>
            <SelectValue placeholder="Select an option" />
          </SelectTrigger>
          <SelectContent>
            {(field.options ?? []).length === 0 ? (
              <div className="px-2 py-1.5 text-xs text-zinc-400">
                No options
              </div>
            ) : (
              (field.options ?? []).map((o, i) => (
                <SelectItem key={i} value={o}>
                  {o}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      )}
    </div>
  )
}
