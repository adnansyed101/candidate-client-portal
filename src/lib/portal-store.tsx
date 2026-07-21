import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type FieldType = "text" | "number" | "select" | "checkbox";

export type TemplateField = {
  id: string;
  label: string;
  key: string;
  type: FieldType;
  required: boolean;
  options?: string[];
};

export type FormTemplate = {
  id: string;
  name: string;
  description?: string;
  fields: TemplateField[];
  createdAt: string;
};

export type Candidate = {
  id: string;
  templateId: string;
  name: string;
  email: string;
  appliedAt: string;
  data: Record<string, unknown>;
};

export type Role = "admin" | "client";

type State = {
  role: Role | null;
  user: string | null;
  templates: FormTemplate[];
  candidates: Candidate[];
};

type Ctx = State & {
  login: (user: string, role: Role) => void;
  logout: () => void;
  saveTemplate: (t: FormTemplate) => void;
  deleteTemplate: (id: string) => void;
  addCandidate: (c: Candidate) => void;
};

const PortalContext = createContext<Ctx | null>(null);

const STORAGE_KEY = "portal_state_v1";

const seedTemplates: FormTemplate[] = [
  {
    id: "tpl-frontend",
    name: "Senior Frontend Engineer",
    description: "React / TypeScript role",
    createdAt: new Date().toISOString(),
    fields: [
      { id: "f1", label: "Seniority", key: "seniority", type: "select", required: true, options: ["Junior", "Mid", "Senior", "Lead"] },
      { id: "f2", label: "Years of Experience", key: "years", type: "number", required: true },
      { id: "f3", label: "Portfolio URL", key: "portfolio", type: "text", required: false },
      { id: "f4", label: "Open to Remote", key: "remote", type: "checkbox", required: false },
    ],
  },
  {
    id: "tpl-design",
    name: "Product Designer",
    description: "Design systems focus",
    createdAt: new Date().toISOString(),
    fields: [
      { id: "f1", label: "Specialty", key: "specialty", type: "select", required: true, options: ["UX", "UI", "Brand", "Motion"] },
      { id: "f2", label: "Years of Experience", key: "years", type: "number", required: true },
      { id: "f3", label: "Available Immediately", key: "available", type: "checkbox", required: false },
    ],
  },
];

const seedCandidates: Candidate[] = [
  {
    id: "c1",
    templateId: "tpl-frontend",
    name: "Amelia Chen",
    email: "amelia@example.com",
    appliedAt: "2026-06-12",
    data: { seniority: "Senior", years: 7, portfolio: "amelia.dev", remote: true },
  },
  {
    id: "c2",
    templateId: "tpl-frontend",
    name: "Marcus Weber",
    email: "marcus@example.com",
    appliedAt: "2026-06-18",
    data: { seniority: "Lead", years: 10, portfolio: "weber.io", remote: false },
  },
  {
    id: "c3",
    templateId: "tpl-design",
    name: "Priya Natarajan",
    email: "priya@example.com",
    appliedAt: "2026-07-01",
    data: { specialty: "UX", years: 6, available: true },
  },
];

function loadState(): State {
  if (typeof window === "undefined") {
    return { role: null, user: null, templates: seedTemplates, candidates: seedCandidates };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as State;
      return {
        role: null,
        user: null,
        templates: parsed.templates?.length ? parsed.templates : seedTemplates,
        candidates: parsed.candidates ?? seedCandidates,
      };
    }
  } catch {}
  return { role: null, user: null, templates: seedTemplates, candidates: seedCandidates };
}

export function PortalProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(() => ({
    role: null,
    user: null,
    templates: seedTemplates,
    candidates: seedCandidates,
  }));
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setState(loadState());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ templates: state.templates, candidates: state.candidates }),
      );
    } catch {}
  }, [state.templates, state.candidates, hydrated]);

  const value: Ctx = {
    ...state,
    login: (user, role) => setState((s) => ({ ...s, user, role })),
    logout: () => setState((s) => ({ ...s, user: null, role: null })),
    saveTemplate: (t) =>
      setState((s) => {
        const exists = s.templates.some((x) => x.id === t.id);
        return {
          ...s,
          templates: exists ? s.templates.map((x) => (x.id === t.id ? t : x)) : [...s.templates, t],
        };
      }),
    deleteTemplate: (id) =>
      setState((s) => ({
        ...s,
        templates: s.templates.filter((t) => t.id !== id),
        candidates: s.candidates.filter((c) => c.templateId !== id),
      })),
    addCandidate: (c) => setState((s) => ({ ...s, candidates: [c, ...s.candidates] })),
  };

  return <PortalContext.Provider value={value}>{children}</PortalContext.Provider>;
}

export function usePortal() {
  const ctx = useContext(PortalContext);
  if (!ctx) throw new Error("usePortal must be used inside PortalProvider");
  return ctx;
}

export function uid(prefix = "id") {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}