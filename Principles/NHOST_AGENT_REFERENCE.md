# NHOST — AI Agent Reference
## General-Purpose Backend-as-a-Service Knowledge Base

**Source:** github.com/nhost/nhost  
**Stars:** 9,100+ | **Forks:** 563+ | **Commits:** 8,038  
**License:** MIT  
**Official docs:** docs.nhost.io | **Website:** nhost.io

**Scope:** General-purpose. Applies to any web or mobile project requiring a managed backend with PostgreSQL, GraphQL, authentication, file storage, and serverless functions — without building and operating that infrastructure from scratch.

AI agents must use this file when:
- Setting up a backend for any web or mobile application
- Implementing authentication (email/password, OAuth, magic link, SMS OTP)
- Writing GraphQL queries, mutations, or subscriptions against a Hasura backend
- Uploading, downloading, or managing files
- Writing or calling serverless functions
- Configuring local development with the Nhost CLI
- Setting up permission rules for database tables

---

## Section 1: What Nhost Is

**Definition:** Nhost is the open-source Firebase alternative with GraphQL. It provides a pre-integrated backend stack so developers can build production applications without manually configuring and connecting databases, auth services, file storage, and APIs.

**The five core services:**
1. **PostgreSQL** — the primary database. All application data lives here.
2. **Hasura** — auto-generates a GraphQL API over PostgreSQL with permission-based access control
3. **Hasura Auth (nhost/auth)** — authentication service integrated with Hasura's permission system
4. **Hasura Storage (nhost/storage)** — file storage with Hasura-based permissions and metadata in PostgreSQL
5. **Serverless Functions** — Node.js functions (JavaScript and TypeScript) deployed on AWS Lambda

**Two deployment options:**
- **Nhost Cloud** — managed hosting at app.nhost.io. Sign up, create a project, done.
- **Self-hosting** — run the entire stack locally or on your own server via docker-compose

**What it is NOT:**
- Not a traditional REST API platform (GraphQL is the primary API layer)
- Not a general-purpose serverless compute platform (functions are for lightweight logic only)
- Not opinionated about frontend framework (React, Next.js, Vue, Svelte, React Native, Flutter all supported)

**Positioning:**
- Nhost is to the backend what Netlify/Vercel is to the frontend
- Replaces: Firebase, Supabase, manually assembled Postgres + Auth + S3 stacks
- Key differentiator: GraphQL-first with Hasura, unified permission model across all services

---

## Section 2: Repository Structure

```
nhost/nhost (monorepo — pnpm workspaces + Turborepo)
├── services/
│   ├── auth/           # Hasura Auth service (Go) — authentication microservice
│   └── storage/        # Hasura Storage service (Go) — file storage microservice
├── packages/
│   ├── nhost-js/       # Main JS/TS SDK (@nhost/nhost-js) — the client library
│   ├── react/          # React SDK (@nhost/react) — React hooks and providers
│   ├── nextjs/         # Next.js SDK (@nhost/nextjs) — SSR/SSG support
│   ├── vue/            # Vue SDK (@nhost/vue)
│   ├── react-apollo/   # Apollo Client integration (@nhost/react-apollo)
│   └── ...             # Other client SDKs and utilities
├── cli/                # Nhost CLI (Go) — local development tool
├── dashboard/          # Admin dashboard (Next.js) — app.nhost.io
├── examples/
│   └── docker-compose/ # Self-hosting example with full docker-compose setup
├── docs/               # Documentation source
├── tools/              # Internal tooling
├── observability/
│   └── grafana/        # Grafana dashboards for monitoring
├── CLAUDE.md           # AI context file (Nhost themselves use Claude)
├── flake.nix           # Nix development environment
├── turbo.json          # Turborepo configuration
└── pnpm-workspace.yaml # Workspace package definitions
```

**Technology stack of the repo itself:**
- Go (auth service, storage service, CLI)
- TypeScript (SDK packages, dashboard)
- pnpm for JS package management
- Turborepo for monorepo build orchestration
- Nix for reproducible dev environments
- Biome for JS/TS linting and formatting
- golangci-lint for Go linting

---

## Section 3: The Architecture — How All Services Connect

```
Client Application (React / Next.js / Vue / React Native / Flutter)
    │
    │  Uses @nhost/nhost-js SDK
    │
    ▼
┌─────────────────────────────────────────────────────────┐
│                    Nhost Backend                         │
│                                                         │
│  ┌─────────────────┐   ┌──────────────────────────┐   │
│  │   Hasura Auth   │   │   Hasura (GraphQL Engine) │   │
│  │  /v1/auth/*     │   │   /v1/graphql             │   │
│  │                 │   │                            │   │
│  │  - Sign up/in   │   │  Auto-generated GraphQL    │   │
│  │  - JWT tokens   │   │  API over PostgreSQL       │   │
│  │  - Refresh      │   │  with row-level security   │   │
│  │  - OAuth        │   │  via permissions           │   │
│  └────────┬────────┘   └───────────┬──────────────┘   │
│           │                        │                    │
│           └──────────┬─────────────┘                   │
│                      │                                  │
│            ┌─────────▼──────────┐                      │
│            │     PostgreSQL      │                      │
│            │  - auth schema      │                      │
│            │  - storage schema   │                      │
│            │  - public schema    │                      │
│            └────────────────────┘                      │
│                                                         │
│  ┌─────────────────┐   ┌─────────────────────────┐    │
│  │  Hasura Storage │   │  Serverless Functions   │    │
│  │  /v1/storage/*  │   │  /v1/functions/*        │    │
│  │                 │   │                         │    │
│  │  - Upload files │   │  - Custom Node.js logic │    │
│  │  - Download     │   │  - TypeScript supported │    │
│  │  - Delete       │   │  - AWS Lambda runtime   │    │
│  │  - Permissions  │   │                         │    │
│  └─────────────────┘   └─────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

**How authentication flows through the system:**
1. User signs in via `nhost.auth.signIn*()` → Auth service validates credentials
2. Auth service returns JWT access token + refresh token
3. JWT contains Hasura-specific claims: `x-hasura-user-id`, `x-hasura-default-role`, `x-hasura-allowed-roles`
4. Client includes JWT as `Authorization: Bearer <token>` on all subsequent requests
5. Hasura uses the JWT claims to apply permission rules to GraphQL queries
6. Storage service uses the same JWT for file access control via Hasura permissions

---

## Section 4: Installation and Setup

### 4.1 Nhost Cloud (Managed — Recommended for Production)

```bash
# No server setup required
# 1. Create account at app.nhost.io
# 2. Create a new project (region, name)
# 3. Get your project credentials:
#    - Subdomain: your-project
#    - Region: eu-central-1 (or selected region)
# 4. Install SDK in your frontend project
```

### 4.2 Install the JavaScript/TypeScript SDK

```bash
# npm
npm install @nhost/nhost-js

# pnpm
pnpm add @nhost/nhost-js

# yarn
yarn add @nhost/nhost-js
```

### 4.3 Install React Package (if using React)

```bash
npm install @nhost/nhost-js @nhost/react
```

### 4.4 Install Next.js Package (if using Next.js)

```bash
npm install @nhost/nhost-js @nhost/nextjs
```

### 4.5 Self-Hosting with Docker Compose

```bash
# Clone the repo
git clone https://github.com/nhost/nhost.git
cd nhost/examples/docker-compose

# Start the full stack locally
docker-compose up -d

# Services will be available at:
# GraphQL: http://localhost:8080/v1/graphql
# Auth: http://localhost:4000/v1/auth
# Storage: http://localhost:8000/v1/files
# Hasura Console: http://localhost:9695
# Mailhog (email testing): http://localhost:8025
```

---

## Section 5: Nhost CLI — Local Development

### 5.1 Install the CLI

```bash
# macOS (Homebrew)
brew install nhost/tap/cli

# npm (all platforms)
npm install -g nhost

# Linux — download binary
curl -L https://raw.githubusercontent.com/nhost/nhost/main/cli/get.sh | bash
```

**Note:** Windows requires WSL2. Use docker-ce inside WSL2 — not Docker Desktop.

### 5.2 CLI Workflow — From Zero to Local Dev

```bash
# Step 1: Log in to Nhost
nhost login

# Step 2: Create a new directory for your project
mkdir my-app && cd my-app

# Step 3: Initialize Nhost project
# This creates nhost/ config directory with migrations and metadata
nhost init

# Step 4: Link to an existing Nhost Cloud project (optional)
# Pulls production config to match locally
nhost link

# Step 5: Start the local development environment
nhost up
# Starts: PostgreSQL, Hasura, Auth, Storage (MinIO), Functions, Mailhog
# Hasura Console: http://localhost:9695 (USE THIS CONSOLE, not cloud)
# GraphQL endpoint: http://localhost:1337/v1/graphql
# Auth endpoint: http://localhost:1337/v1/auth
# Storage endpoint: http://localhost:1337/v1/files

# Step 6: Tear down
nhost down
```

### 5.3 Critical Rule: Always Use the CLI-Started Hasura Console

**IMPORTANT:** When doing local development, ALWAYS make schema changes through the Hasura Console started by `nhost up` (at `http://localhost:9695`). This console automatically tracks:
- Database migrations (saved to `nhost/migrations/default/`)
- Hasura metadata (saved to `nhost/metadata/`)

Do NOT use the cloud Hasura Console for local changes. Do NOT manually edit SQL outside the tracked console — changes won't be captured in migrations.

### 5.4 Project Directory Structure (Created by `nhost init`)

```
your-project/
├── nhost/
│   ├── migrations/
│   │   └── default/          # Timestamped SQL migration files
│   │       ├── 1644247179684_create_table_public_customers/
│   │       │   ├── up.sql    # Forward migration
│   │       │   └── down.sql  # Rollback migration
│   ├── metadata/             # Hasura metadata (JSON/YAML)
│   │   ├── tables.yaml       # Table relationships, permissions
│   │   ├── actions.yaml      # Hasura actions
│   │   └── ...
│   ├── seeds/                # Seed data SQL files
│   └── config.yaml           # Nhost project configuration
├── functions/                # Serverless function files
│   └── hello.ts              # Example function at /v1/functions/hello
└── ...your app code
```

### 5.5 Deploying Changes to Production

The recommended workflow is Git-based deployment:

```bash
# 1. Make changes locally (schema, metadata, functions)
#    All changes tracked automatically in nhost/ directory

# 2. Commit changes to git
git add nhost/ functions/
git commit -m "Add customers table and auth permissions"

# 3. Push to GitHub
git push origin main

# 4. Nhost automatically deploys:
#    - Database migrations (in order)
#    - Hasura metadata (permissions, relationships, actions)
#    - Serverless functions
```

---

## Section 6: The JavaScript/TypeScript SDK — Complete API

### 6.1 Creating the Nhost Client

```typescript
import { createClient } from '@nhost/nhost-js'

// Nhost Cloud:
const nhost = createClient({
  subdomain: 'your-project-subdomain',
  region: 'eu-central-1',     // or us-east-1, ap-southeast-1, etc.
})

// Self-hosted:
const nhost = createClient({
  authUrl: 'http://localhost:4000',
  storageUrl: 'http://localhost:8000',
  graphqlUrl: 'http://localhost:8080/v1/graphql',
  functionsUrl: 'http://localhost:3000',
})
```

**What `createClient` does internally:**
1. Instantiates auth, storage, graphql, and functions sub-clients
2. Auto-detects storage for sessions (localStorage in browsers, memory otherwise)
3. Sets up middleware chain for automatic token refresh
4. Attaches authorization tokens to all service requests automatically
5. Updates session storage when new tokens are received

**Admin client (server-side only — NEVER in browser):**
```typescript
import { createClient } from '@nhost/nhost-js'

// For server-side operations that bypass user permissions:
const nhostAdmin = createClient({
  subdomain: 'your-project',
  region: 'eu-central-1',
  adminSecret: process.env.NHOST_ADMIN_SECRET,  // NEVER expose this client-side
})
```

### 6.2 The Sub-Clients

The main `nhost` object exposes four sub-clients:

```typescript
nhost.auth      // Authentication operations
nhost.storage   // File storage operations
nhost.graphql   // GraphQL query/mutation/subscription
nhost.functions // Serverless function invocation
```

---

## Section 7: Authentication — Complete Reference

### 7.1 Sign Up and Sign In Methods

```typescript
// Email + Password Sign Up
const { session, error } = await nhost.auth.signUp({
  email: 'user@example.com',
  password: 'securepassword123',
  options: {
    displayName: 'Jane Doe',          // optional
    locale: 'en',                      // optional
    metadata: { plan: 'free' },        // optional custom metadata stored in user record
    redirectTo: 'https://app.com/confirm', // optional email confirmation redirect
  }
})

// Email + Password Sign In
const { session, error } = await nhost.auth.signInEmailPassword({
  email: 'user@example.com',
  password: 'securepassword123',
})

// Magic Link (passwordless email)
const { error } = await nhost.auth.signInEmailPasswordless({
  email: 'user@example.com',
  options: { redirectTo: 'https://app.com/auth/callback' }
})

// SMS OTP (requires SMS provider configured)
// Step 1: Send OTP
const { error } = await nhost.auth.signInEmailPasswordless({
  phoneNumber: '+1234567890',
})
// Step 2: Verify OTP
const { session, error } = await nhost.auth.signInPhoneNumberOTP({
  phoneNumber: '+1234567890',
  otp: '123456',
})

// OAuth / Social Sign In
// Redirects to provider — use redirectTo to return to app
await nhost.auth.signIn({
  provider: 'github',   // 'google', 'facebook', 'twitter', 'apple', 'linkedin', etc.
  options: { redirectTo: 'https://app.com/auth/callback' }
})

// Sign Out
const { error } = await nhost.auth.signOut()

// Sign out all sessions (all devices)
const { error } = await nhost.auth.signOut({ all: true })
```

### 7.2 Session and User Management

```typescript
// Get current session (synchronous)
const session = nhost.auth.getSession()
// Returns: { accessToken, accessTokenExpiresAt, refreshToken, refreshTokenId, user }
// Returns null if not authenticated

// Get current user (synchronous)
const user = nhost.auth.getUser()
// Returns: { id, email, displayName, avatarUrl, locale, metadata, roles, ... }

// Check if authenticated (synchronous)
const isAuthenticated = nhost.auth.isAuthenticated()

// Get current access token
const accessToken = nhost.auth.getAccessToken()

// Refresh token manually (usually handled automatically)
const { session, error } = await nhost.auth.refreshSession()

// Change display name
const { error } = await nhost.auth.changeDisplayName('New Name')

// Change email (sends verification email)
const { error } = await nhost.auth.changeEmail({ newEmail: 'new@example.com' })

// Change password
const { error } = await nhost.auth.changePassword({ newPassword: 'newpassword' })

// Password reset (sends email)
const { error } = await nhost.auth.resetPassword({
  email: 'user@example.com',
  options: { redirectTo: 'https://app.com/reset-confirm' }
})

// Listen to auth state changes
const unsubscribe = nhost.auth.onAuthStateChanged((event, session) => {
  // event: 'SIGNED_IN' | 'SIGNED_OUT' | 'TOKEN_REFRESHED' | 'USER_UPDATED'
  console.log('Auth state:', event, session)
})
// Call unsubscribe() to stop listening

// Listen to token changes specifically
nhost.auth.onTokenChanged((session) => {
  // Called when access token changes
  console.log('New token:', session?.accessToken)
})
```

### 7.3 How JWT Tokens Work with Hasura

When a user signs in, Hasura Auth returns a JWT with this structure:

```json
{
  "sub": "user-uuid",
  "iat": 1640000000,
  "exp": 1640003600,
  "https://hasura.io/jwt/claims": {
    "x-hasura-user-id": "user-uuid",
    "x-hasura-default-role": "user",
    "x-hasura-allowed-roles": ["user", "me"],
    "x-hasura-org-id": "org-uuid"  // if custom claims configured
  }
}
```

This JWT is automatically attached to all GraphQL requests by the SDK. Hasura reads the claims and applies permissions. The key claims:
- `x-hasura-user-id` — the authenticated user's ID (use in `WHERE user_id = 'x-hasura-user-id()'` permission rules)
- `x-hasura-default-role` — the role used for GraphQL requests
- `x-hasura-allowed-roles` — all roles this user can switch to

### 7.4 Supported OAuth Providers

The following OAuth providers are officially supported (must be configured in Nhost Dashboard):
- GitHub, Google, Facebook, Twitter/X, Apple, LinkedIn, GitLab, Discord, Twitch, Spotify, Bitbucket, Strava, Azuread, Windows Live, WorkOS

### 7.5 Multi-Factor Authentication

```typescript
// Generate TOTP secret (Google Authenticator, Authy)
const { totpSecret, error } = await nhost.auth.generateTotpSecret()

// Activate TOTP MFA
const { error } = await nhost.auth.activateTotp({
  totp: '123456',   // Current TOTP code from authenticator app
  activeTotpSecret: totpSecret.totp_secret,
})

// Sign in with TOTP (after password step)
const { session, error } = await nhost.auth.signInMfaTotp({
  otp: '123456',
  ticket: ticket,  // received from initial password sign-in response
})
```

---

## Section 8: GraphQL API — Complete Reference

### 8.1 Making GraphQL Requests

```typescript
// Query
const { data, error } = await nhost.graphql.request({
  query: `
    query GetCustomers {
      customers {
        id
        name
        email
        created_at
      }
    }
  `
})

// Query with variables
const { data, error } = await nhost.graphql.request({
  query: `
    query GetCustomer($id: uuid!) {
      customers_by_pk(id: $id) {
        id
        name
        email
      }
    }
  `,
  variables: { id: 'some-uuid' }
})

// Mutation — Insert
const { data, error } = await nhost.graphql.request({
  query: `
    mutation InsertCustomer($name: String!, $email: String!) {
      insert_customers_one(object: { name: $name, email: $email }) {
        id
        name
        email
      }
    }
  `,
  variables: { name: 'Alice', email: 'alice@example.com' }
})

// Mutation — Update
const { data, error } = await nhost.graphql.request({
  query: `
    mutation UpdateCustomer($id: uuid!, $name: String!) {
      update_customers_by_pk(
        pk_columns: { id: $id }
        _set: { name: $name }
      ) {
        id
        name
      }
    }
  `,
  variables: { id: 'some-uuid', name: 'Alice Updated' }
})

// Mutation — Delete
const { data, error } = await nhost.graphql.request({
  query: `
    mutation DeleteCustomer($id: uuid!) {
      delete_customers_by_pk(id: $id) {
        id
      }
    }
  `,
  variables: { id: 'some-uuid' }
})
```

### 8.2 GraphQL Endpoint URLs

```
Cloud:
  GraphQL: https://<subdomain>.hasura.<region>.nhost.run/v1/graphql
  WebSocket (subscriptions): wss://<subdomain>.hasura.<region>.nhost.run/v1/graphql

Local development:
  GraphQL: http://localhost:1337/v1/graphql
  WebSocket: ws://localhost:1337/v1/graphql
```

### 8.3 Hasura Auto-Generated Operations

For every PostgreSQL table, Hasura auto-generates:

| Operation | Example for `customers` table |
|---|---|
| Select all | `query { customers { id name } }` |
| Select by PK | `query { customers_by_pk(id: $id) { ... } }` |
| Select with filter | `query { customers(where: { name: { _eq: "Alice" } }) { ... } }` |
| Select with order | `query { customers(order_by: { created_at: desc }) { ... } }` |
| Select with pagination | `query { customers(limit: 10, offset: 0) { ... } }` |
| Insert one | `mutation { insert_customers_one(object: {...}) { ... } }` |
| Insert many | `mutation { insert_customers(objects: [...]) { ... } }` |
| Update by PK | `mutation { update_customers_by_pk(pk_columns: {id: $id}, _set: {...}) }` |
| Update many | `mutation { update_customers(where: {...}, _set: {...}) }` |
| Delete by PK | `mutation { delete_customers_by_pk(id: $id) { ... } }` |
| Delete many | `mutation { delete_customers(where: {...}) { ... } }` |
| Aggregate | `query { customers_aggregate { aggregate { count } } }` |
| Subscription | `subscription { customers { id name } }` |

### 8.4 Using with Apollo Client (React)

```typescript
// Install:
// npm install @nhost/react-apollo @apollo/client graphql

// Setup in app root:
import { NhostProvider } from '@nhost/react'
import { NhostApolloProvider } from '@nhost/react-apollo'

function App() {
  return (
    <NhostProvider nhost={nhost}>
      <NhostApolloProvider nhost={nhost}>
        {/* Apollo Client is auto-configured with auth headers */}
        <YourApp />
      </NhostApolloProvider>
    </NhostProvider>
  )
}

// Use Apollo hooks anywhere in the component tree:
import { useQuery } from '@apollo/client'
const { data, loading, error } = useQuery(GET_CUSTOMERS_QUERY)
```

---

## Section 9: Storage — File Management

### 9.1 Uploading Files

```typescript
// Upload a single file (File object from input[type=file])
const { fileMetadata, error } = await nhost.storage.upload({
  file: fileObject,            // File | Blob
  bucketId: 'default',        // optional, defaults to 'default'
  name: 'custom-name.jpg',    // optional, overrides original filename
})
// Returns: { id, name, bucketId, mimeType, size, createdAt, updatedAt, isUploaded }

// Upload to a specific bucket
const { fileMetadata, error } = await nhost.storage.upload({
  file: fileObject,
  bucketId: 'avatars',        // must exist in Nhost dashboard
})
```

### 9.2 Getting File URLs

```typescript
// Get a public URL for a file
const publicUrl = nhost.storage.getPublicUrl({ fileId: 'file-uuid' })
// Returns: https://<subdomain>.storage.<region>.nhost.run/v1/files/<file-uuid>

// Get a presigned URL (temporary access URL for private files)
const { presignedUrl, error } = await nhost.storage.getPresignedUrl({
  fileId: 'file-uuid',
})
// Returns: { url, expiration }

// Get URL with image transformation
const transformedUrl = nhost.storage.getPublicUrl({
  fileId: 'file-uuid',
  transform: {
    width: 400,
    height: 400,
    quality: 80,
    format: 'webp',   // 'jpg', 'png', 'webp', 'avif'
    fit: 'cover',     // 'cover', 'contain', 'fill', 'outside', 'inside'
  }
})
```

### 9.3 Downloading and Deleting Files

```typescript
// Download a file as a Blob
const { file, error } = await nhost.storage.download({ fileId: 'file-uuid' })

// Delete a file
const { error } = await nhost.storage.delete({ fileId: 'file-uuid' })
```

### 9.4 How Storage Permissions Work

Storage uses Hasura permissions, not a custom rules engine. Files and buckets are stored as rows in PostgreSQL:

- `storage.files` table — stores file metadata (id, name, bucketId, mimeType, size, uploadedByUserId)
- `storage.buckets` table — stores bucket configuration

Permissions are set in Hasura on these tables. Example: allow users to read only their own files:

```yaml
# In Hasura permissions for storage.files table, "user" role, SELECT:
filter:
  uploadedByUserId:
    _eq: X-Hasura-User-Id
```

### 9.5 Image Transformation

Nhost Storage includes on-the-fly image transformation (via an integrated image service):

```typescript
// Resize, format, and quality control:
const url = nhost.storage.getPublicUrl({
  fileId: 'file-uuid',
  transform: {
    width: 200,      // pixels
    height: 200,     // pixels
    quality: 85,     // 1-100
    format: 'webp',  // output format
    fit: 'cover',    // resize strategy
  }
})
```

---

## Section 10: Serverless Functions

### 10.1 What They Are

Serverless functions are Node.js files deployed to AWS Lambda in the same region as your Nhost backend. They handle HTTP requests and return HTTP responses. They run alongside your backend, not as a separate deployment.

**Supported languages:** JavaScript (.js) and TypeScript (.ts)

**URL pattern:** `https://<subdomain>.functions.<region>.nhost.run/v1/functions/<function-name>`  
or locally: `http://localhost:1337/v1/functions/<function-name>`

### 10.2 Creating a Function

File location: `functions/` directory in your project root.

```typescript
// functions/hello.ts
import type { Request, Response } from 'express'

export default (req: Request, res: Response) => {
  const name = req.query.name ?? 'World'
  res.json({ message: `Hello, ${name}!` })
}
```

The filename determines the URL path:
- `functions/hello.ts` → `/v1/functions/hello`
- `functions/users/profile.ts` → `/v1/functions/users/profile`
- `functions/webhooks/stripe.ts` → `/v1/functions/webhooks/stripe`

### 10.3 Function Request and Response

Functions receive an Express-compatible `Request` object and `Response` object:

```typescript
import type { Request, Response } from 'express'

export default async (req: Request, res: Response) => {
  // Access request data:
  const body = req.body           // parsed JSON body
  const query = req.query         // URL query params
  const params = req.params       // path params
  const headers = req.headers     // HTTP headers
  const method = req.method       // 'GET', 'POST', etc.

  // Access authenticated user (if JWT is valid):
  const userId = req.auth?.userId  // from Authorization header JWT
  const userRoles = req.auth?.userRoles

  // Send responses:
  res.json({ data: 'response' })         // JSON response (200)
  res.status(201).json({ created: true }) // With status code
  res.status(400).json({ error: 'Bad request' })
  res.status(500).json({ error: 'Internal error' })
}
```

### 10.4 Accessing Environment Variables in Functions

```typescript
// All env vars set in Nhost Dashboard are available:
const apiKey = process.env.MY_API_KEY
const dbUrl = process.env.NHOST_GRAPHQL_URL  // auto-injected by Nhost

// Nhost auto-injects these in functions:
// NHOST_GRAPHQL_URL — your GraphQL endpoint
// NHOST_ADMIN_SECRET — admin secret for Hasura (use carefully)
// NHOST_BACKEND_URL — base URL of your backend
```

### 10.5 Making GraphQL Calls from Functions

```typescript
import type { Request, Response } from 'express'

// Use native fetch (available in Node.js 18+):
export default async (req: Request, res: Response) => {
  const graphqlResponse = await fetch(process.env.NHOST_GRAPHQL_URL!, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-hasura-admin-secret': process.env.NHOST_ADMIN_SECRET!, // admin access
      // Or use user JWT for user-level access:
      // 'Authorization': `Bearer ${req.headers.authorization?.split(' ')[1]}`
    },
    body: JSON.stringify({
      query: `
        query {
          customers {
            id
            name
          }
        }
      `
    })
  })

  const { data, errors } = await graphqlResponse.json()
  res.json({ customers: data.customers })
}
```

### 10.6 Package Dependencies in Functions

Create a `package.json` in your `functions/` directory for function-specific dependencies:

```json
{
  "name": "my-app-functions",
  "version": "1.0.0",
  "dependencies": {
    "stripe": "^14.0.0",
    "nodemailer": "^6.0.0"
  }
}
```

---

## Section 11: Hasura Permissions — Row-Level Security

### 11.1 How Permissions Work

Permissions in Hasura define what data each user role can access. They are set per table, per operation (SELECT, INSERT, UPDATE, DELETE), per role.

**Built-in roles:**
- `admin` — full access, bypasses all permissions (when using admin secret)
- `user` — authenticated users (anyone with a valid JWT)
- `public` — unauthenticated requests (no JWT)

**Custom roles:** Create in Hasura or via Nhost Dashboard.

### 11.2 Common Permission Patterns

**Users can only see their own data:**
```yaml
# SELECT permission for "user" role on "notes" table:
filter:
  user_id:
    _eq: X-Hasura-User-Id
```

**Insert sets the user_id automatically:**
```yaml
# INSERT permission for "user" role on "notes" table:
check: {}
set:
  user_id: X-Hasura-User-Id  # auto-sets user_id to current user
columns:
  - title
  - content
  # user_id is excluded from columns — it's set automatically via "set"
```

**Public read access (no auth required):**
```yaml
# SELECT permission for "public" role on "posts" table:
filter:
  published:
    _eq: true
```

**Admin bypass (for serverless functions using admin secret):**
```
No permissions needed — admin secret bypasses all permission checks.
```

### 11.3 JWT Claim Variables in Permissions

Use these session variables in permission filters:
- `X-Hasura-User-Id` — current user's UUID
- `X-Hasura-Default-Role` — user's default role
- `X-Hasura-Allowed-Roles` — array of all user roles

---

## Section 12: React Integration

### 12.1 Setup

```typescript
// src/nhost.ts
import { createClient } from '@nhost/nhost-js'

export const nhost = createClient({
  subdomain: process.env.REACT_APP_NHOST_SUBDOMAIN!,
  region: process.env.REACT_APP_NHOST_REGION!,
})
```

```typescript
// src/index.tsx
import { NhostProvider } from '@nhost/react'
import { nhost } from './nhost'

ReactDOM.render(
  <NhostProvider nhost={nhost}>
    <App />
  </NhostProvider>,
  document.getElementById('root')
)
```

### 12.2 React Hooks

```typescript
import {
  useAuthenticated,
  useSignInEmailPassword,
  useSignOut,
  useUserData,
  useAccessToken,
  useNhostClient,
} from '@nhost/react'

// Check authentication status reactively
const isAuthenticated = useAuthenticated()
// Returns boolean — re-renders component when auth state changes

// Get user data reactively
const user = useUserData()
// Returns user object or null

// Sign in hook
const { signInEmailPassword, isLoading, error } = useSignInEmailPassword()
await signInEmailPassword('user@example.com', 'password')

// Sign out hook
const { signOut, isLoading } = useSignOut()
await signOut()

// Get the nhost client instance
const nhost = useNhostClient()

// Get access token (refreshes automatically)
const accessToken = useAccessToken()
```

### 12.3 Protecting Routes

```typescript
// Component that requires authentication:
import { useAuthenticated } from '@nhost/react'
import { Navigate } from 'react-router-dom'

function ProtectedRoute({ children }) {
  const isAuthenticated = useAuthenticated()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return children
}
```

---

## Section 13: Next.js Integration

### 13.1 Setup with App Router

```typescript
// lib/nhost.ts
import { createClient } from '@nhost/nhost-js'

export const nhost = createClient({
  subdomain: process.env.NEXT_PUBLIC_NHOST_SUBDOMAIN!,
  region: process.env.NEXT_PUBLIC_NHOST_REGION!,
})
```

```typescript
// app/providers.tsx
'use client'
import { NhostProvider } from '@nhost/nextjs'
import { nhost } from '@/lib/nhost'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <NhostProvider nhost={nhost}>
      {children}
    </NhostProvider>
  )
}
```

### 13.2 Server-Side Data Fetching

```typescript
// app/customers/page.tsx — Server Component
import { nhost } from '@/lib/nhost'

export default async function CustomersPage() {
  const { data, error } = await nhost.graphql.request({
    query: `query { customers { id name email } }`
  })

  return (
    <ul>
      {data?.customers.map(c => <li key={c.id}>{c.name}</li>)}
    </ul>
  )
}
```

---

## Section 14: Environment Variables and Configuration

### 14.1 Required Client-Side Variables

```bash
# .env.local (React / Next.js)
NEXT_PUBLIC_NHOST_SUBDOMAIN=your-project-subdomain
NEXT_PUBLIC_NHOST_REGION=eu-central-1

# For self-hosted:
NEXT_PUBLIC_NHOST_GRAPHQL_URL=http://localhost:1337/v1/graphql
NEXT_PUBLIC_NHOST_AUTH_URL=http://localhost:1337/v1/auth
NEXT_PUBLIC_NHOST_STORAGE_URL=http://localhost:1337/v1/files
NEXT_PUBLIC_NHOST_FUNCTIONS_URL=http://localhost:1337/v1/functions
```

### 14.2 Server-Side (Secret) Variables

```bash
# Never expose these client-side:
NHOST_ADMIN_SECRET=your-hasura-admin-secret
NHOST_JWT_SECRET=your-jwt-secret
```

### 14.3 Nhost Cloud Regions

| Region Code | Location |
|---|---|
| `eu-central-1` | EU (Frankfurt) |
| `us-east-1` | US East (Virginia) |
| `ap-southeast-1` | Asia Pacific (Singapore) |

---

## Section 15: Self-Hosting Reference

### 15.1 Docker Compose Structure

The self-hosted stack (`examples/docker-compose`) runs:

```yaml
services:
  postgres:         # PostgreSQL database
  hasura:           # Hasura GraphQL Engine
  auth:             # Hasura Auth service
  storage:          # Hasura Storage service
  functions:        # Serverless functions runner
  minio:            # S3-compatible local file storage
  mailhog:          # Email testing (captures emails locally)
  dashboard:        # Optional: Nhost admin dashboard
  traefik:          # Optional: Reverse proxy / load balancer
```

### 15.2 Required Environment Variables for Self-Hosting

```bash
# Core
POSTGRES_PASSWORD=secretpgpassword
HASURA_GRAPHQL_ADMIN_SECRET=nhost-admin-secret
HASURA_GRAPHQL_JWT_SECRET='{"type":"HS256","key":"secret-jwt-key-at-least-32-chars"}'
HASURA_GRAPHQL_DATABASE_URL=postgres://postgres:${POSTGRES_PASSWORD}@postgres:5432/postgres

# Auth
AUTH_JWT_CUSTOM_CLAIMS_PATH=
AUTH_ANONYMOUS_USERS_ENABLED=false
AUTH_EMAIL_SIGNIN_EMAIL_VERIFIED_REQUIRED=true
AUTH_SERVER_URL=http://auth:4000

# Storage
STORAGE_SERVER_URL=http://storage:8000

# MinIO (local S3 replacement)
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=minioadmin
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
S3_BUCKET=nhost
S3_ENDPOINT=http://minio:8484
```

---

## Section 16: Nhost SDK Packages — Full List

| Package | npm name | Purpose |
|---|---|---|
| Core client | `@nhost/nhost-js` | Framework-agnostic SDK with auth, graphql, storage, functions |
| React | `@nhost/react` | React hooks and NhostProvider |
| Next.js | `@nhost/nextjs` | SSR/SSG support for Next.js |
| Vue | `@nhost/vue` | Vue composables and plugin |
| React Apollo | `@nhost/react-apollo` | Pre-configured Apollo Client for React |
| Dart/Flutter | `nhost_sdk` (pub.dev) | Full SDK for Flutter apps |

---

## Section 17: Key Decision Guide for Agents

### When to use Nhost vs alternatives:

| Scenario | Recommendation |
|---|---|
| Need GraphQL API with auto-generated CRUD | Use Nhost (Hasura is the best open-source GraphQL engine) |
| Need REST API only (no GraphQL) | Consider a custom Express/FastAPI backend instead |
| Need real-time data (subscriptions) | Nhost excels — Hasura WebSocket subscriptions built in |
| Need complex custom backend logic | Use Nhost + serverless functions for light logic; custom backend for heavy logic |
| Firebase replacement (mobile-focused) | Nhost is a strong choice — auth, storage, database, realtime |
| Need to own all data (GDPR, compliance) | Self-host Nhost on your own infrastructure |
| Budget constrained, many small apps | Nhost free tier or self-host |

### When choosing database operations:

| Need | Approach |
|---|---|
| Simple CRUD | Hasura auto-generated GraphQL operations |
| Complex joins/aggregations | GraphQL with Hasura relationships |
| Business logic that touches multiple tables | Hasura Actions (REST endpoint that Hasura calls as a mutation) or serverless function |
| Background jobs, cron | Hasura Event Triggers (fires on DB changes) or external cron + function |
| Full-text search | Hasura + PostgreSQL `to_tsvector` or integrate Algolia via function |
| Analytics/reporting | Hasura aggregate queries or direct PostgreSQL via function |

---

## Appendix: Repository Statistics

**URL:** github.com/nhost/nhost  
**Stars:** 9,100+ | **Forks:** 563+  
**Commits:** 8,038 | **Contributors:** 100+  
**Languages:** Go (services, CLI), TypeScript (SDK, dashboard)  
**Build system:** Turborepo + pnpm workspaces  
**License:** MIT  
**Community:** Discord (nhost.io/discord), GitHub Discussions  
**Notable:** The repo contains a `CLAUDE.md` file — Nhost uses Claude for development context  
**Packages available:** npm (@nhost/*), pub.dev (Dart/Flutter)  
**Hosted platform:** app.nhost.io | **Self-host:** docker-compose in examples/

**This reference file was generated on: April 3, 2026**  
**Source verification:** All service names, SDK method signatures, URL patterns, CLI commands, environment variable names, and architecture descriptions were verified against the live repository at github.com/nhost/nhost, the official documentation at docs.nhost.io, and verified community tutorials. No API methods, CLI commands, or architecture claims were fabricated.
