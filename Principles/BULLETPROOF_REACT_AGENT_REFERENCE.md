# BULLETPROOF REACT — AI Agent Reference for StackForge
## Purpose and Usage Instructions

**Source:** github.com/alan2207/bulletproof-react  
**Stars:** 34,800+ | **Forks:** 3,200+ | **Language:** TypeScript 92%  
**License:** MIT

AI agents (Cursor, Antigravity, Claude Code) must use this file when:
- Building or modifying StackForge's Next.js 14 frontend
- Making decisions about folder structure, component organisation, or import paths
- Writing API calls, handling state, managing forms, or implementing auth on the frontend
- Implementing error boundaries, loading states, or security patterns in React
- Deciding between local state, server state, global state, or URL state

**Hard rule:** Every decision about the StackForge frontend must be grounded in the principles documented here. Do not invent folder structures, import patterns, or state management approaches that contradict this guide. When unsure, default to the most local, simplest solution first — then escalate.

---

## Section 1: What This Repository Is

A battle-tested, opinionated architecture guide for production React applications. It is **not a template, boilerplate, or framework** — it is a set of principles with a working sample application demonstrating them.

**Core philosophy:** The goal is code that is easy to get started with, simple to understand and maintain, uses the right tools for the job, has clean boundaries between parts, keeps everyone on the team aligned, and is secure, performant, and scalable in codebase and team size.

**What this means for StackForge agents:** Do not make architectural decisions based on what "feels right" or what a model's training defaulted to. This document defines the correct approach. If a pattern in this guide contradicts an instinct, this guide wins.

---

## Section 2: Project Structure — The Single Most Important Section

### 2.1 Top-Level `src/` Directory Layout

Every file in StackForge's Next.js frontend must belong in exactly one of these directories:

```
src/
├── app/              # Next.js App Router — routes, layouts, providers, router config
│   ├── routes/       # Page components / route files
│   ├── app.tsx       # Main application component
│   ├── provider.tsx  # Global providers wrapping the entire app
│   └── router.tsx    # Router configuration
├── assets/           # Static files: images, fonts, icons
├── components/       # Shared UI components used across the ENTIRE application
├── config/           # Global config, exported env variables
├── features/         # Feature-based modules (see Section 2.2)
├── hooks/            # Shared hooks used across the entire application
├── lib/              # Reusable libraries pre-configured for the application
├── stores/           # Global state stores
├── testing/          # Test utilities and mocks
├── types/            # Shared TypeScript types used across the application
└── utils/            # Shared utility functions
```

### 2.2 The `features/` Directory — Heart of the Architecture

Most code lives in `features/`. Each feature is a self-contained module:

```
src/features/[feature-name]/
├── api/          # API request declarations + React Query hooks for this feature
├── assets/       # Feature-specific static assets
├── components/   # Components scoped to this feature only
├── hooks/        # Hooks scoped to this feature only
├── stores/       # Feature-level state stores
├── types/        # Feature-specific TypeScript types
└── index.ts      # Public API — ONLY export what other features/app may use
```

**For StackForge, the features are:**
- `features/auth/` — login, register, token management, user state
- `features/checker/` — paste code, submit for checking, display results
- `features/projects/` — create project, upload ZIP, view project list
- `features/generation/` — generation progress, file viewer, results
- `features/dashboard/` — project list, history, score summary

### 2.3 The Unidirectional Import Rule — CRITICAL

**This rule is enforced by ESLint `import/no-restricted-paths`. Agents must never violate it.**

The import direction is strictly one-way:

```
app → features → shared modules
                 (components, hooks, lib, types, utils)
```

**What this means concretely:**

```typescript
// ✅ ALLOWED — app imports from features:
// src/app/routes/checker.tsx
import { CheckerForm } from '@/features/checker'

// ✅ ALLOWED — features import from shared:
// src/features/checker/components/CheckerForm.tsx
import { Button } from '@/components/ui/button'
import { useDebounce } from '@/hooks/use-debounce'

// ✅ ALLOWED — features import from other features ONLY via their public index.ts
// src/features/checker/components/CheckerForm.tsx
import { useUser } from '@/features/auth'

// ❌ FORBIDDEN — shared components importing from features:
// src/components/Layout.tsx
import { useAuthStore } from '@/features/auth/stores/auth-store' // WRONG

// ❌ FORBIDDEN — features importing from app:
// src/features/checker/api/checker-api.ts
import { router } from '@/app/router' // WRONG

// ❌ FORBIDDEN — circular imports between features:
// src/features/checker importing from src/features/projects
// AND src/features/projects importing from src/features/checker // WRONG
```

**ESLint enforcement config:**
```javascript
'import/no-restricted-paths': [
  'error',
  {
    zones: [
      // features cannot import from app
      { target: './src/features', from: './src/app' },
      // shared modules cannot import from features or app
      {
        target: ['./src/components', './src/hooks', './src/lib', './src/types', './src/utils'],
        from: ['./src/features', './src/app'],
      },
    ],
  },
],
```

### 2.4 The `index.ts` Barrel Export Rule

Every feature MUST have an `index.ts` that explicitly exports only what the outside world needs. Agents must never import directly from internal feature files from outside the feature.

```typescript
// src/features/auth/index.ts — correct barrel:
export { AuthProvider } from './components/auth-provider'
export { LoginForm } from './components/login-form'
export { useUser } from './hooks/use-user'
export { useLogin } from './api/use-login'
export type { User } from './types'

// ✅ Correct usage from outside the feature:
import { useUser, LoginForm } from '@/features/auth'

// ❌ Wrong — reaching inside a feature:
import { useUser } from '@/features/auth/hooks/use-user'
```

---

## Section 3: Project Standards — Tooling and Conventions

### 3.1 TypeScript — Non-Negotiable

TypeScript is used throughout StackForge's frontend. It catches issues during refactoring that ESLint misses due to JavaScript's dynamic nature.

**Rules for agents:**
- Never use `any` as a type — use `unknown` if the type is truly unknown, then narrow it
- Always type API response shapes — never let them be `any` or untyped
- Use Zod for runtime validation of external data (API responses, form inputs)
- Prefer `interface` for object shapes, `type` for unions and intersections

### 3.2 ESLint — Code Quality Gates

ESLint detects language-related bugs. Must be configured with:
- `import/no-restricted-paths` — enforces the unidirectional import rule
- `@typescript-eslint` rules — TypeScript-specific checks
- React-specific rules — hooks dependency arrays, key props

### 3.3 Prettier — Formatting

Prettier handles all formatting. Enable "format on save" in Antigravity/Cursor. If auto-formatting fails, it signals a syntax error — do not ignore this.

### 3.4 Absolute Imports — Always Use `@/`

Configure TypeScript path aliases so all imports use `@/` prefix:

```typescript
// tsconfig.json:
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}

// ✅ Always use absolute imports:
import { Button } from '@/components/ui/button'
import { useUser } from '@/features/auth'

// ❌ Never use relative imports across directories:
import { Button } from '../../../components/ui/button'
```

### 3.5 Naming Conventions

- **Components:** PascalCase — `CheckerForm.tsx`, `ProjectCard.tsx`
- **Hooks:** camelCase with `use` prefix — `useUser.ts`, `useDebounce.ts`
- **Utilities:** camelCase — `formatScore.ts`, `parseError.ts`
- **Types:** PascalCase — `type User`, `interface CheckResult`
- **Directories:** kebab-case — `features/checker/`, `components/ui/`
- **Files:** kebab-case — `checker-form.tsx`, `use-user.ts`

### 3.6 Husky Git Hooks

The repo uses Husky to run checks pre-commit:
- Lint check — fails commit if ESLint errors exist
- Type check — fails commit if TypeScript errors exist
- Format check — fails commit if Prettier formatting is wrong

Run `yarn prepare` to initialise Husky hooks after cloning.

---

## Section 4: Components and Styling

### 4.1 Component Co-location Principle

Keep components as close as possible to where they are used:
- **Feature-specific component:** lives in `src/features/[feature]/components/`
- **Cross-feature shared component:** lives in `src/components/`
- **One-time component used only in one page:** can live next to the page file

### 4.2 Extract Components Early — No Inline Render Functions

```typescript
// ❌ WRONG — inline render function, hard to maintain:
function Component() {
  function renderItems() {
    return <ul>...</ul>
  }
  return <div>{renderItems()}</div>
}

// ✅ CORRECT — extract as a named component:
function Items() {
  return <ul>...</ul>
}
function Component() {
  return <div><Items /></div>
}
```

**Rule:** If a piece of UI can be considered a unit, extract it into its own component. Do not add multiple rendering functions inside a single component.

### 4.3 Wrapping Third-Party Components

Wrap 3rd party components in local abstractions. This makes future changes easier — you only update the wrapper, not every usage site.

```typescript
// ✅ Wrap third-party components:
// src/components/ui/button.tsx
import { Button as ChakraButton } from '@chakra-ui/react'

interface ButtonProps {
  // application-specific props + Chakra props
}

export const Button = ({ ...props }: ButtonProps) => {
  return <ChakraButton {...props} />
}

// Usage:
import { Button } from '@/components/ui/button' // NOT from chakra directly
```

### 4.4 Styling Approach for StackForge

StackForge uses **Tailwind CSS** — a zero-runtime styling solution. This is the correct choice per bulletproof-react's performance guidance: runtime styling solutions (emotion, styled-components) that generate styles during runtime should be avoided for performance; prefer Tailwind, vanilla-extract, or CSS modules which generate styles at build time.

### 4.5 Component Library

If a component library is needed, the guide recommends:
- **Chakra UI** — great DX, fast prototyping, good defaults, accessible
- **Shadcn/UI** — copy-paste components, fully customisable, Tailwind-based

StackForge uses Shadcn/UI components wrapped in local abstractions per the pattern above.

---

## Section 5: API Layer

### 5.1 The API Layer Pattern

Every API call in StackForge follows this structure:

**Step 1 — Fetcher function:** A plain async function that makes the HTTP call

```typescript
// src/features/checker/api/analyze-code.ts
import { apiClient } from '@/lib/api-client'
import type { CheckResult } from '../types'

interface AnalyzeCodeInput {
  code: string
  language: 'js' | 'ts' | 'py'
}

export const analyzeCode = (data: AnalyzeCodeInput): Promise<CheckResult> => {
  return apiClient.post('/api/checker/analyze', data)
}
```

**Step 2 — React Query hook:** A hook that wraps the fetcher with caching and loading state

```typescript
// src/features/checker/api/use-analyze-code.ts
import { useMutation } from '@tanstack/react-query'
import { analyzeCode } from './analyze-code'

export const useAnalyzeCode = () => {
  return useMutation({
    mutationFn: analyzeCode,
    onSuccess: (data) => {
      // handle success — e.g., navigate to results
    },
    onError: (error) => {
      // handle error — e.g., show toast notification
    },
  })
}
```

**Step 3 — Export from feature index:**

```typescript
// src/features/checker/index.ts
export { useAnalyzeCode } from './api/use-analyze-code'
```

### 5.2 The Central API Client

StackForge must have a single configured API client in `src/lib/api-client.ts`:

```typescript
// src/lib/api-client.ts
import axios from 'axios'
import { env } from '@/config/env'

export const apiClient = axios.create({
  baseURL: env.API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor — attach auth token
apiClient.interceptors.request.use((config) => {
  const token = getAuthToken() // from secure storage
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor — handle errors globally
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired — log out user
      logout()
    }
    // Show error notification
    showErrorToast(error.response?.data?.message ?? 'Something went wrong')
    return Promise.reject(error)
  }
)
```

### 5.3 MSW for API Mocking During Development

Use MSW (Mock Service Worker) to mock APIs during development. This lets frontend development proceed without waiting for backend endpoints.

```typescript
// src/testing/mocks/handlers/checker.ts
import { http, HttpResponse } from 'msw'

export const checkerHandlers = [
  http.post('/api/checker/analyze', async ({ request }) => {
    const body = await request.json()
    return HttpResponse.json({
      score: 85,
      issues: [],
      summary: 'Your backend looks production-ready!'
    })
  }),
]
```

### 5.4 Typing API Responses — Always

Never leave API responses untyped. Use Zod for runtime validation:

```typescript
import { z } from 'zod'

const IssueSchema = z.object({
  id: z.string(),
  type: z.string(),
  severity: z.enum(['RED', 'AMBER', 'GREEN']),
  title: z.string(),
  description: z.string(),
  fixSteps: z.array(z.string()),
  file: z.string().optional(),
  line: z.number().optional(),
})

const CheckResultSchema = z.object({
  score: z.number().min(0).max(100),
  issues: z.array(IssueSchema),
  summary: z.string(),
})

export type CheckResult = z.infer<typeof CheckResultSchema>
```

---

## Section 6: State Management

### 6.1 The Four Types of State — Choose the Right One

**This is the most important decision agents make.** Do not default to global state for everything.

| State Type | What It Is | Tool | When to Use |
|---|---|---|---|
| **Local UI state** | State specific to one component — form input, toggle, modal open | `useState`, `useReducer` | Always start here. If only one component needs it, keep it local. |
| **Global UI state** | Shared UI state across many components — sidebar open, theme, notifications | Zustand | Only when genuinely needed across distant parts of the tree |
| **Server cache state** | Remote data fetched from the API and cached | React Query (TanStack Query) | ALL API data. Never store API responses in Redux/Zustand. |
| **URL state** | Data stored in the URL — filters, pagination, selected tabs | `useSearchParams` (Next.js), `nuqs` | When state should survive a page refresh or be shareable via URL |

### 6.2 Server Cache State — The Most Common Case

StackForge's frontend is primarily a server-state application. The checker results, project list, generation status — all of this is server state. Use React Query for all of it:

```typescript
// src/features/projects/api/use-projects.ts
import { useQuery } from '@tanstack/react-query'
import { getProjects } from './get-projects'

export const useProjects = () => {
  return useQuery({
    queryKey: ['projects'],
    queryFn: getProjects,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// src/features/projects/api/use-project-status.ts
// Poll generation status every 2 seconds until complete:
export const useProjectStatus = (projectId: string) => {
  return useQuery({
    queryKey: ['project-status', projectId],
    queryFn: () => getProjectStatus(projectId),
    refetchInterval: (query) => {
      // Stop polling when generation is complete or failed
      const status = query.state.data?.status
      if (status === 'COMPLETE' || status === 'FAILED') return false
      return 2000 // Poll every 2 seconds
    },
  })
}
```

### 6.3 Keep State as Local as Possible

```typescript
// ❌ WRONG — globalising state unnecessarily:
// stores/ui-store.ts
const useUIStore = create((set) => ({
  checkerCode: '',
  setCheckerCode: (code: string) => set({ checkerCode: code }),
}))

// ✅ CORRECT — local state in the component that owns it:
function CheckerPage() {
  const [code, setCode] = useState('')
  // only this component needs `code`
}
```

### 6.4 Form State — React Hook Form

Use React Hook Form for all forms. Do not manage form state manually with `useState` per field.

```typescript
// src/features/checker/components/checker-form.tsx
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const CheckerFormSchema = z.object({
  code: z.string().min(1, 'Code is required'),
  language: z.enum(['js', 'ts', 'py']),
})

type CheckerFormValues = z.infer<typeof CheckerFormSchema>

export function CheckerForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<CheckerFormValues>({
    resolver: zodResolver(CheckerFormSchema),
    defaultValues: { language: 'js' },
  })

  const { mutate: analyzeCode, isPending } = useAnalyzeCode()

  const onSubmit = (data: CheckerFormValues) => {
    analyzeCode(data)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <textarea {...register('code')} />
      {errors.code && <p>{errors.code.message}</p>}
      <button type="submit" disabled={isPending}>
        {isPending ? 'Analyzing...' : 'Analyze'}
      </button>
    </form>
  )
}
```

### 6.5 URL State — For Shareable/Persistent UI State

Use URL state for filters, pagination, and tabs that should survive page refresh:

```typescript
// src/features/dashboard/components/project-filters.tsx
import { useSearchParams } from 'next/navigation'

export function ProjectFilters() {
  const searchParams = useSearchParams()
  const status = searchParams.get('status') ?? 'all'
  // status is now in the URL: /dashboard?status=complete
}
```

---

## Section 7: Testing

### 7.1 Testing Philosophy — Test Behaviour, Not Implementation

Test what the component RENDERS and what the USER SEES — not internal state values, not implementation details.

**Correct mindset:** If you refactor a component to use a different state management solution, the tests should still pass because the visual output to the user hasn't changed.

### 7.2 Testing Pyramid for StackForge Frontend

| Layer | Tool | What to Test | Quantity |
|---|---|---|---|
| Unit | Vitest + Testing Library | Shared utility functions, pure functions, complex isolated logic | Few |
| Integration | Vitest + Testing Library + MSW | Complete user flows within a feature: fill form → submit → see result | MOST |
| E2E | Playwright | Critical full application flows: login → create project → see results | Few critical paths |

### 7.3 Integration Test Pattern — The Standard

```typescript
// src/features/checker/__tests__/checker-form.test.tsx
import { render, screen, userEvent } from '@/testing/test-utils'
import { CheckerPage } from '../components/checker-page'
import { mockHandlers } from '@/testing/mocks/handlers'

test('user can submit code and see the analysis result', async () => {
  const user = userEvent.setup()

  render(<CheckerPage />)

  // User sees the form
  const codeInput = screen.getByRole('textbox', { name: /code/i })
  const submitButton = screen.getByRole('button', { name: /analyze/i })

  // User types code
  await user.type(codeInput, 'const api_key = "sk-123abc"')

  // User submits
  await user.click(submitButton)

  // User sees the result
  expect(await screen.findByText(/api key exposed/i)).toBeInTheDocument()
  expect(screen.getByText(/red/i)).toBeInTheDocument()
})
```

**Key rules:**
- Use `screen.getBy*` queries based on accessible roles and labels — not test IDs or CSS classes
- Use `userEvent` (not `fireEvent`) — it simulates real user interactions
- Use `findBy*` for async content that appears after an API call
- Never test component internal state — test what the user sees

### 7.4 Test Utilities Setup

```typescript
// src/testing/test-utils.tsx
import { render } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

function TestProviders({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } }
  })
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

// Re-export everything from testing library
export * from '@testing-library/react'
// Override render with one that includes providers
export const render = (ui: React.ReactElement) =>
  renderWithProviders(ui, { wrapper: TestProviders })
```

### 7.5 E2E Tests with Playwright — Critical Paths Only

```typescript
// e2e/checker.spec.ts
import { test, expect } from '@playwright/test'

test('user can check an AI-generated backend for production readiness', async ({ page }) => {
  await page.goto('/checker')

  await page.getByRole('textbox', { name: /paste your backend code/i })
    .fill('const apiKey = "sk-12345"\napp.use(cors())')

  await page.getByRole('button', { name: /analyze/i }).click()

  await expect(page.getByText(/api key exposed/i)).toBeVisible({ timeout: 10000 })
  await expect(page.getByText(/cors misconfigured/i)).toBeVisible()
  await expect(page.getByText(/score/i)).toBeVisible()
})
```

---

## Section 8: Error Handling

### 8.1 The Three Layers of Error Handling

**Layer 1 — API interceptor (global):**
Handle common errors at the API client level before they reach components:
- 401 Unauthorized → log out user, redirect to login
- 403 Forbidden → show permission error
- 500 Server Error → show generic error toast
- Network error → show connection error toast

```typescript
// Already shown in Section 5.2 — the response interceptor in api-client.ts
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const status = error.response?.status
    if (status === 401) logout()
    showErrorToast(error.response?.data?.message ?? 'Something went wrong')
    return Promise.reject(error)
  }
)
```

**Layer 2 — React Error Boundaries (component-level):**
Do NOT use a single error boundary for the entire app. Place multiple error boundaries at different levels so errors are contained locally.

```typescript
// src/app/provider.tsx
import { ErrorBoundary } from 'react-error-boundary'

function AppErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <div>
      <h2>Something went wrong</h2>
      <p>{error.message}</p>
      <button onClick={resetErrorBoundary}>Try again</button>
    </div>
  )
}

// Wrap individual features with their own error boundaries:
function CheckerPage() {
  return (
    <ErrorBoundary FallbackComponent={AppErrorFallback}>
      <CheckerForm />
    </ErrorBoundary>
  )
}
```

**Layer 3 — Error tracking (production):**
Use Sentry to track production errors. Sentry reports any issue that breaks the app with context about browser, OS, user, and code location.

```typescript
// src/lib/sentry.ts
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
})
```

### 8.2 React Query Error Handling

```typescript
// Handle loading and error states in components:
function ProjectsList() {
  const { data: projects, isLoading, error } = useProjects()

  if (isLoading) return <ProjectsSkeleton />
  if (error) return <ErrorMessage error={error} />

  return <div>{projects.map(p => <ProjectCard key={p.id} project={p} />)}</div>
}
```

---

## Section 9: Security

### 9.1 Authentication — JWT Tokens

StackForge uses Clerk for auth, which handles JWT tokens. But agents must understand the underlying principles:

**Token storage rules:**
- Most secure: application state (memory) — but lost on page refresh
- Acceptable: HttpOnly cookies — not accessible from JavaScript, immune to XSS
- NEVER: `localStorage` or `sessionStorage` — accessible by any JavaScript, vulnerable to XSS

```typescript
// ✅ Clerk handles this correctly — tokens in HttpOnly cookies
// The sample app uses js-cookie assuming the real API enforces HttpOnly attribute
// Application does NOT have access to the cookie from client side
```

**What this means for StackForge:** Clerk stores tokens securely. Never attempt to access or store tokens in `localStorage` for any reason.

### 9.2 XSS Prevention

Sanitise all user inputs before displaying them. React escapes strings by default, but `dangerouslySetInnerHTML` bypasses this.

```typescript
// ❌ NEVER use without sanitisation:
<div dangerouslySetInnerHTML={{ __html: userInput }} />

// ✅ If you must render HTML, sanitise first:
import DOMPurify from 'dompurify'
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(userInput) }} />

// ✅ For plain text, just render it — React escapes it automatically:
<p>{userInput}</p>
```

### 9.3 Authorization — RBAC and PBAC

**RBAC (Role-Based Access Control):** Gate features by user role.

```typescript
// src/components/rbac.tsx
interface RBACProps {
  allowedRoles: UserRole[]
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function RBAC({ allowedRoles, children, fallback = null }: RBACProps) {
  const { user } = useUser()
  if (!user || !allowedRoles.includes(user.role)) return <>{fallback}</>
  return <>{children}</>
}

// Usage:
<RBAC allowedRoles={['admin', 'pro']}>
  <PremiumFeature />
</RBAC>
```

**PBAC (Permission-Based Access Control):** Gate actions by ownership.

```typescript
// Only the project owner can delete their project:
function ProjectActions({ project }: { project: Project }) {
  const { user } = useUser()
  const isOwner = user?.id === project.userId

  return (
    <div>
      {isOwner && (
        <button onClick={() => deleteProject(project.id)}>Delete</button>
      )}
    </div>
  )
}
```

**CRITICAL NOTE:** Client-side auth only enhances UX and complements server-side security. The backend MUST enforce authorisation — never trust the frontend to be the only line of defence.

### 9.4 User State as Global State

User info must be globally accessible from anywhere in the application:

```typescript
// src/features/auth/stores/user-store.ts or via React Query auth hook
// User state should be available from anywhere without prop drilling
const { user } = useUser() // Available in any component
```

---

## Section 10: Performance

### 10.1 State Colocation — Rule #1

Keep state as close as possible to where it's used. This prevents re-rendering components that don't depend on the updated state.

### 10.2 Expensive State Initialisation — Use Initialiser Function

```typescript
// ❌ WRONG — executed on EVERY re-render:
const [state, setState] = useState(myExpensiveFn())

// ✅ CORRECT — executed ONLY ONCE on mount:
const [state, setState] = useState(() => myExpensiveFn())
```

### 10.3 Children Prop Pattern — Prevent Unnecessary Re-renders

```typescript
// ❌ NOT OPTIMISED — PureComponent re-renders whenever count updates:
const App = () => <Counter />
const Counter = () => {
  const [count, setCount] = useState(0)
  return (
    <div>
      <button onClick={() => setCount(c => c + 1)}>count: {count}</button>
      <PureComponent /> {/* re-renders on every count change */}
    </div>
  )
}

// ✅ OPTIMISED — PureComponent does NOT re-render when count updates:
const App = () => (
  <Counter>
    <PureComponent />
  </Counter>
)
const Counter = ({ children }: { children: React.ReactNode }) => {
  const [count, setCount] = useState(0)
  return (
    <div>
      <button onClick={() => setCount(c => c + 1)}>count: {count}</button>
      {children} {/* children prop doesn't change when count changes */}
    </div>
  )
}
```

### 10.4 React Context — Use Wisely

- **Good for:** Low-velocity data — theme, user info, small UI state
- **Bad for:** High-velocity data — data that changes frequently (e.g., real-time updates)
- **For high-velocity data:** Use `use-context-selector` library, or Zustand/Jotai which have built-in selectors

```typescript
// ❌ DON'T use context for frequently-updating data:
const GenerationProgressContext = createContext(progress) // Updates every second

// ✅ DO use React Query for server state that updates frequently:
const { data: status } = useProjectStatus(projectId) // Polling handled by React Query
```

### 10.5 Image Optimisation

- Use Next.js `<Image>` component — automatic optimisation, lazy loading, correct sizing
- Use WEBP format for smaller file sizes
- Use `srcset` to serve appropriately-sized images per device

```typescript
import Image from 'next/image'

// ✅ Always use Next.js Image component:
<Image
  src="/logo.png"
  alt="StackForge logo"
  width={200}
  height={50}
  priority // for above-the-fold images
/>
```

### 10.6 Zero-Runtime Styling — Tailwind

StackForge uses Tailwind CSS (zero-runtime) rather than styled-components or emotion (runtime). This is intentional — runtime styling libraries generate CSS during JavaScript execution, impacting performance. Tailwind generates all CSS at build time.

---

## Section 11: StackForge-Specific Folder Map

Applying bulletproof-react to StackForge's actual features:

```
src/
├── app/
│   ├── (auth)/
│   │   ├── sign-in/page.tsx
│   │   └── sign-up/page.tsx
│   ├── (dashboard)/
│   │   ├── dashboard/page.tsx       → imports from features/dashboard
│   │   ├── checker/page.tsx         → imports from features/checker
│   │   └── project/
│   │       ├── new/page.tsx         → imports from features/projects
│   │       └── [id]/
│   │           ├── analyze/page.tsx → imports from features/projects
│   │           ├── clarify/page.tsx → imports from features/projects
│   │           ├── generate/page.tsx → imports from features/generation
│   │           └── result/page.tsx  → imports from features/generation
│   ├── layout.tsx
│   └── provider.tsx
│
├── components/
│   └── ui/                          → Shadcn/UI components (wrapped)
│       ├── button.tsx
│       ├── badge.tsx
│       ├── card.tsx
│       └── ...
│
├── features/
│   ├── auth/
│   │   ├── api/use-user.ts
│   │   ├── components/auth-guard.tsx
│   │   ├── stores/user-store.ts
│   │   └── index.ts
│   │
│   ├── checker/                     → Phase 1 core feature
│   │   ├── api/
│   │   │   ├── analyze-code.ts      → fetcher function
│   │   │   └── use-analyze-code.ts  → React Query mutation
│   │   ├── components/
│   │   │   ├── checker-form.tsx     → code paste + language select + submit
│   │   │   ├── report-display.tsx   → score badge + issue cards
│   │   │   └── issue-card.tsx       → single issue with severity colour
│   │   ├── types/index.ts
│   │   └── index.ts
│   │
│   ├── projects/                    → Phase 2+ feature
│   │   ├── api/
│   │   │   ├── use-projects.ts
│   │   │   ├── use-create-project.ts
│   │   │   └── use-upload-zip.ts
│   │   ├── components/
│   │   │   ├── project-card.tsx
│   │   │   └── new-project-form.tsx
│   │   └── index.ts
│   │
│   └── generation/                  → Phase 2+ feature
│       ├── api/
│       │   └── use-project-status.ts  → polling hook
│       ├── components/
│       │   ├── generation-progress.tsx → step indicator
│       │   └── file-viewer.tsx         → syntax-highlighted code
│       └── index.ts
│
├── hooks/
│   ├── use-debounce.ts
│   └── use-local-storage.ts
│
├── lib/
│   ├── api-client.ts                → configured axios instance
│   ├── query-client.ts              → React Query client config
│   └── sentry.ts
│
├── stores/
│   └── notification-store.ts        → toast notifications (Zustand)
│
├── testing/
│   ├── test-utils.tsx               → custom render with providers
│   └── mocks/
│       └── handlers/
│           ├── checker.ts
│           └── projects.ts
│
├── types/
│   └── api.ts                       → shared API types
│
└── utils/
    ├── format-score.ts
    └── cn.ts                        → Tailwind class merging utility
```

---

## Section 12: Agent Decision Rules

### When creating a new file, ask in this order:

1. Is this specific to ONE feature? → `src/features/[feature]/`
2. Is this used across MULTIPLE features? → `src/components/` or `src/hooks/` or `src/utils/`
3. Is this a configuration or environment variable? → `src/config/`
4. Is this a test utility? → `src/testing/`

### When writing state, ask in this order:

1. Does only THIS component need it? → `useState`
2. Does THIS component and its direct children need it? → prop drilling or `useState` + props
3. Is it data from the server/API? → React Query (`useQuery`/`useMutation`)
4. Is it form input data? → React Hook Form
5. Is it URL-dependent (filter, page)? → URL state (`useSearchParams`)
6. Is it genuinely needed across many distant components? → Zustand store

### When writing an API call:

1. Create the fetcher function in `features/[feature]/api/[action].ts`
2. Wrap it in a React Query hook in `features/[feature]/api/use-[action].ts`
3. Export it from `features/[feature]/index.ts`
4. Use it in components via the hook — never call the fetcher directly from a component

### Import direction check (run before every import):

- Am I in `src/components/`, `src/hooks/`, `src/lib/`, `src/types/`, or `src/utils/`?
  - If yes: I CANNOT import from `src/features/` or `src/app/`
- Am I in `src/features/`?
  - If yes: I CANNOT import from `src/app/`
  - I CAN import from other features ONLY via their `index.ts`
- Am I in `src/app/`?
  - I CAN import from anywhere

---

## Appendix: Repository Statistics

**URL:** github.com/alan2207/bulletproof-react  
**Stars:** 34,800+ | **Forks:** 3,200+  
**Language:** TypeScript 92%, JavaScript 6.6%  
**CI:** Three separate GitHub Actions workflows — Next.js App, Next.js Pages, React Vite  
**License:** MIT  
**Sample apps:** Two Next.js apps (App Router + Pages Router) + one React Vite app in `apps/` folder

**This reference file was generated on: April 3, 2026**  
**Source verification:** All folder structures, ESLint rules, code patterns, and architecture principles verified against the live repository at github.com/alan2207/bulletproof-react and its documentation files in the `docs/` directory. No patterns fabricated.
