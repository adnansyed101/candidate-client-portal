import { z } from 'zod'

// ── Field type enum ──────────────────────────────────────────────────────────

export const FieldTypeSchema = z.enum(['text', 'number', 'select', 'checkbox', 'calendar', 'textarea', 'multi-select'])
export type FieldType = z.infer<typeof FieldTypeSchema>

// ── In-memory template types (builder UI + portal store) ─────────────────────

export const TemplateFieldSchema = z.object({
  id: z.string(),
  label: z.string(),
  key: z.string(),
  type: FieldTypeSchema,
  required: z.boolean(),
  options: z.array(z.string()).optional(),
})
export type TemplateField = z.infer<typeof TemplateFieldSchema>

export const FormTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  fields: z.array(TemplateFieldSchema),
  createdAt: z.string(),
})
export type FormTemplate = z.infer<typeof FormTemplateSchema>

// ── Prisma-aligned API types ─────────────────────────────────────────────────

export const PrismaFormFieldSchema = z.object({
  id: z.string(),
  jobId: z.string(),
  type: z.string(),
  label: z.string(),
  name: z.string(),
  required: z.boolean(),
  options: z.any().nullable(),
})
export type PrismaFormField = z.infer<typeof PrismaFormFieldSchema>

export const PrismaJobSchema = z.object({
  id: z.string(),
  title: z.string(),
  createdAt: z.coerce.date(),
  formFields: z.array(PrismaFormFieldSchema),
})
export type PrismaJob = z.infer<typeof PrismaJobSchema>

// ── API request payloads ─────────────────────────────────────────────────────

export const FormFieldPayloadSchema = z.object({
  type: FieldTypeSchema,
  label: z.string(),
  name: z.string(),
  required: z.boolean(),
  options: z.array(z.string()).nullable(),
})
export type FormFieldPayload = z.infer<typeof FormFieldPayloadSchema>

export const JobTemplatePayloadSchema = z.object({
  title: z.string(),
  formFields: z.array(FormFieldPayloadSchema),
})
export type JobTemplatePayload = z.infer<typeof JobTemplatePayloadSchema>

// ── API response wrapper ─────────────────────────────────────────────────────

export const ApiSuccessResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.literal(true),
    data: dataSchema,
    message: z.string().optional(),
  })

export const ApiErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.string().optional(),
  message: z.string().optional(),
})

// ── Candidate types ──────────────────────────────────────────────────────────

export const CandidateDataSchema = z.record(
  z.string(),
  z.union([z.string(), z.number(), z.boolean(), z.null(), z.array(z.string())]),
)
export type CandidateData = z.infer<typeof CandidateDataSchema>

export const CandidatePayloadSchema = z.object({
  jobId: z.string(),
  name: z.string(),
  email: z.string(),
  data: CandidateDataSchema,
})
export type CandidatePayload = z.infer<typeof CandidatePayloadSchema>

export const CandidateSchema = z.object({
  id: z.string(),
  templateId: z.string(),
  name: z.string(),
  email: z.string(),
  appliedAt: z.string(),
  data: z.record(z.string(), z.unknown()),
})
export type Candidate = z.infer<typeof CandidateSchema>

export const PrismaCandidateSchema = z.object({
  id: z.string(),
  jobId: z.string(),
  name: z.string(),
  email: z.string(),
  data: z.record(z.string(), z.unknown()),
  createdAt: z.coerce.date(),
})
export type PrismaCandidate = z.infer<typeof PrismaCandidateSchema>

export function prismaCandidateToAppCandidate(
  candidate: PrismaCandidate,
): Candidate {
  return {
    id: candidate.id,
    templateId: candidate.jobId,
    name: candidate.name,
    email: candidate.email,
    appliedAt:
      candidate.createdAt instanceof Date
        ? candidate.createdAt.toISOString().split('T')[0]
        : String(candidate.createdAt).split('T')[0],
    data: candidate.data as Record<string, unknown>,
  }
}

const RoleSchema = z.enum(['admin', 'client'])
export type Role = z.infer<typeof RoleSchema>

// ── Transform: Prisma API response → app FormTemplate ────────────────────────

export function prismaJobToFormTemplate(job: PrismaJob): FormTemplate {
  return {
    id: job.id,
    name: job.title,
    fields: job.formFields.map((f) => ({
      id: f.id,
      label: f.label,
      key: f.name,
      type: f.type as FieldType,
      required: f.required,
      options: Array.isArray(f.options) ? (f.options as string[]) : undefined,
    })),
    createdAt:
      typeof job.createdAt === 'string'
        ? job.createdAt
        : job.createdAt.toISOString(),
  }
}

// ── Transform: app FormTemplate → API payload ────────────────────────────────

export function buildTemplatePayload(template: FormTemplate): JobTemplatePayload {
  return {
    title: template.name.trim(),
    formFields: template.fields.map((f) => ({
      type: f.type,
      label: f.label.trim(),
      name: f.key.trim(),
      required: f.required,
      options: f.type === 'select' || f.type === 'multi-select' ? (f.options ?? []) : null,
    })),
  }
}

// ── Transform: form values → candidate payload ───────────────────────────────

export function buildCandidatePayload(
  template: FormTemplate,
  values: Record<string, unknown>,
): CandidatePayload {
  const { name, email, ...rest } = values
  const data: CandidateData = {}

  for (const f of template.fields) {
    const v = rest[f.key]
    if (v === undefined || v === '' || v === null) {
      data[f.key] = null
      continue
    }
    if (f.type === 'number') {
      const n = typeof v === 'number' ? v : Number(v)
      data[f.key] = Number.isNaN(n) ? null : n
    } else if (f.type === 'checkbox') {
      data[f.key] = Boolean(v)
    } else if (f.type === 'multi-select') {
      data[f.key] = Array.isArray(v) ? v : [String(v)]
    } else {
      data[f.key] = String(v)
    }
  }

  return {
    jobId: template.id,
    name: String(name ?? '').trim(),
    email: String(email ?? '').trim(),
    data,
  }
}

// ── Dynamic form schema builder ──────────────────────────────────────────────

export function buildCandidateFormSchema(fields: TemplateField[]) {
  const shape: Record<string, z.ZodTypeAny> = {
    name: z.string().trim().min(1, 'Name is required').max(100),
    email: z.string().trim().email('Enter a valid email').max(255),
  }

  for (const f of fields) {
    let s: z.ZodTypeAny
    switch (f.type) {
      case 'number':
        s = z.preprocess(
          (v) =>
            v === '' || v === undefined || v === null ? undefined : Number(v),
          f.required
            ? z.number({ message: 'Enter a number' })
            : z.number({ message: 'Enter a number' }).optional(),
        )
        break
      case 'checkbox':
        s = z.boolean().default(false)
        break
      case 'select':
        s = f.required
          ? z.string().min(1, `${f.label} is required`)
          : z.string().optional()
        break
      case 'multi-select':
        s = f.required
          ? z.array(z.string()).min(1, `${f.label} is required`)
          : z.array(z.string()).optional()
        break
      case 'calendar':
        s = f.required
          ? z.string().min(1, `${f.label} is required`)
          : z.string().optional()
        break
      case 'textarea':
        s = f.required
          ? z.string().trim().min(1, `${f.label} is required`).max(2000)
          : z.string().trim().max(2000).optional()
        break
      default:
        s = f.required
          ? z.string().trim().min(1, `${f.label} is required`).max(500)
          : z.string().trim().max(500).optional()
    }
    shape[f.key] = s
  }
  return z.object(shape)
}
