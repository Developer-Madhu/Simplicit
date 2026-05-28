export interface ContextTool {
  id: string;
  name: string;
  description: string;
  qualityScore: number;
  promptTemplate: string;
  recommended?: boolean;
}

export const CONTEXT_TOOLS: ContextTool[] = [
  {
    id: "claude-code",
    name: "Claude Code",
    description: "Copy this prompt into Claude Code. Claude will generate a simplicit.context.md file describing your project. Upload that file back into Simplicit for improved backend generation.",
    qualityScore: 5,
    recommended: true,
    promptTemplate: `Analyze my current frontend codebase and generate a file named 'simplicit.context.md' that follows this exact structure:

# Project Overview
[Brief name and description of the project]

# Business Rules
- [List 5-10 core functional rules of the application]

# User Journeys
### [Journey Name]
1. [Step 1]
2. [Step 2]

# User Roles and Permissions
- **[Role Name]**: [List of permissions]

# API Endpoints
- \`GET /api/path\`: [Description]

# Data Models
### [Entity Name]
- [Field Name]: [Type]
- [Relation] -> [Other Entity]

# Authentication Flow
[Describe how users log in and session management]

# Environment Variables Required
- [List key variables]

# File Upload Requirements
[Describe any file upload needs]

# Real-time Requirements
[Describe any websocket or push notification needs]

# Third-Party Integrations
- [Name]: [Purpose]

# Error Response Format
[Describe the standard error JSON structure]

Be as deterministic and precise as possible. Do not invent features that don't exist in the code.`
  },
  {
    id: "cursor",
    name: "Cursor",
    description: "Optimized for Cursor's Composer and codebase indexing. Generates a complete project specification.",
    qualityScore: 5,
    recommended: true,
    promptTemplate: `I am using Simplicit to generate a backend for this project. Please index my frontend codebase and generate a 'simplicit.context.md' file. 

The file MUST include:
1. Project Overview
2. Business Rules
3. User Journeys (detailed steps)
4. User Roles and Permissions
5. Inferred API Endpoints
6. Data Models (Entities, Fields, Relations)
7. Authentication Logic
8. Integration requirements

Format the output as a clean Markdown file. Focus on identifying the 'Why' behind the features so the backend can be architected correctly.`
  },
  {
    id: "lovable",
    name: "Lovable",
    description: "Optimized for projects built with Lovable/GPT-Engineer. Focuses on full-stack semantic mapping.",
    qualityScore: 4,
    promptTemplate: `Generate a 'simplicit.context.md' specification based on the current state of this Lovable project.

Focus on:
- All data entities you've created in the UI
- Current navigation and route structure
- Role-based visibility rules implemented in components
- Form validation rules

The goal is to provide a complete context for generating a high-performance backend architecture.`
  },
  {
    id: "bolt",
    name: "Bolt",
    description: "Optimized for Bolt.new applications. Captures modern full-stack requirements.",
    qualityScore: 4,
    promptTemplate: `Analyze this Bolt application and produce a 'simplicit.context.md' file. 

Detail every data model required by the frontend, all existing API routes used in components, and the authentication flow. Use the Simplicit Context format (Overview, Rules, Journeys, Roles, Endpoints, Models, Auth, Env, Uploads, Real-time, Integrations).`
  },
  {
    id: "v0",
    name: "v0",
    description: "Component-centric prompt for v0.dev. Helps reconstruct architecture from UI components.",
    qualityScore: 3,
    promptTemplate: `Look at the UI components we've built in v0 and generate a 'simplicit.context.md' file. 

Describe the project overview, the users intended for this UI, and the data structures needed to populate these views. This will be used to generate a real backend API.`
  },
  {
    id: "windsurf",
    name: "Windsurf",
    description: "Optimized for Windsurf's context-aware coding environment.",
    qualityScore: 5,
    promptTemplate: `Using your Flow capabilities, reconstruct the full business logic of this project into a 'simplicit.context.md' file.

Map all frontend state management to backend data models. Identify every user role and its associated permissions based on the component hierarchy.`
  },
  {
    id: "replit",
    name: "Replit Agent",
    description: "Optimized for Replit Agent's autonomous project building.",
    qualityScore: 4,
    promptTemplate: `Analyze the codebase created so far and generate a 'simplicit.context.md' file. 

Capture the project goals, the business rules we've established, and the database schema that would be required to support the current frontend features.`
  },
  {
    id: "custom",
    name: "Custom Frontend",
    description: "Generic prompt for hand-written React/Next.js or existing internal projects.",
    qualityScore: 3,
    promptTemplate: `Please generate a 'simplicit.context.md' file for this project. 

The file should comprehensively describe:
- Project Overview & Goals
- Business Rules (functional constraints)
- User Journeys (common flows)
- User Roles and Permissions (who can do what)
- API Endpoints (current and expected)
- Data Models (entities, attributes, relationships)
- Authentication Flow
- Environment Variables
- File Uploads & Real-time needs
- Third-Party Integrations

Analyze the code to find these details. If any information is missing, infer it from the UI structure and naming conventions.`
  }
];
