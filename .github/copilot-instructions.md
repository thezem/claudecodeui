# Project Guidelines: Claude Code UI

## Code Style

**Frontend (React/TypeScript)**

- Use TypeScript with strict mode (`src/**/*.tsx`)
- Functional components with custom hooks (React 18 patterns)
- Tailwind CSS + class-variance-authority for styling (see [src/components/ui/](src/components/ui/))
- Context API for app state (auth, theme, WebSocket, tasks) via provider composition in [src/App.tsx](src/App.tsx#L1)
- Import order: React imports → local utils → context → types

**Backend (Express/Node)**

- ES2020 JavaScript, no TypeScript on backend (except type comments where needed)
- Express Router pattern per route file in [server/routes/](server/routes/)
- Centralized auth middleware: check `authenticateToken()` in [server/middleware/auth.js](server/middleware/auth.js)
- Return JSON with consistent error shape: `{ success: false, error: "message", code: "CODE" }`

**Naming & Conventions**

- React components: PascalCase (`TodoList.jsx`), hooks: camelCase (`useDeviceSettings.ts`)
- Backend routes: lowercase kebab-case (`/api/projects/add-manual`)
- Database queries use better-sqlite3 synchronous API (not promises)

## Architecture

**Layered Frontend** (see [src/App.tsx](src/App.tsx))

```
I18nextProvider → ThemeProvider → AuthProvider → WebSocketProvider
→ TasksSettingsProvider → TaskMasterProvider → ProtectedRoute → Router
```

Each context is a single responsibility: auth tokens, theme state, real-time updates, feature flags.

**Backend Structure**

- [server/index.js](server/index.js): Express app + WebSocket server + file watchers (projects discovery)
- [server/routes/](server/routes/): Separate Express routers for auth, projects, agent, git, mcp, commands, taskmaster, settings, user
- [server/utils/](server/utils/): Shared helpers (git config, MCP detection, command parser, WebSocket broadcaster)
- [server/database/](server/database/): SQLite schema (users, api_keys, github_tokens) with auto-migration

**AI Integration Layer**

- [server/claude-sdk.js](server/claude-sdk.js): Direct Claude SDK queries with session tracking + tool approval workflow
- [server/cursor-cli.js](server/cursor-cli.js): Cursor subprocess spawning
- [server/openai-codex.js](server/openai-codex.js): OpenAI Codex subprocess spawning
- [shared/modelConstants.js](shared/modelConstants.js): Unified model definitions (Claude, Cursor, Codex) used by both frontend and backend

**Real-time Communication**

- WebSocket server broadcasts `projects_updated`, `loading_progress` to all connected clients
- File watchers monitor `~/.claude/projects`, `~/.cursor/chats`, `~/.codex/sessions` (debounced 300ms)
- Session state NOT persisted; projects re-scanned on each API call to detect changes

## Build and Test

**Development**

```bash
npm run dev              # Concurrent: server (port 3001) + Vite client (port 5173)
npm run server          # Start Express server only
npm run client          # Start Vite dev server only
npm run typecheck       # TypeScript validation (no emit)
```

**Production Build**

```bash
npm run build           # Vite production build → dist/
npm run start           # Build + server (uses dist/ frontend)
```

**CLI Deployment**

```bash
cloudcli --port 3001                    # Start server
pm2 start npm --name claude-code-ui -- start   # Background service
```

**Environment Setup**

- Requires Node v22+, npm 10+
- Create `.env` file in project root with optional overrides (see [load-env.js](server/load-env.js))
- Default DATABASE_PATH: `~/.cloudcli/auth.db`

## Project Conventions

**Platform vs OSS Mode** (key differentiator)

- **OSS (default, `IS_PLATFORM=false`)**: Local SQLite user database, JWT auth, login/register forms
- **Platform (`IS_PLATFORM=true`)**: Proxy-based authentication, single user context, no auth DB
- Both modes share same API surface; frontend adapts UI based on `VITE_IS_PLATFORM`

**File Watchers & Project Discovery**

- Debounced (300ms) to prevent rapid re-scanning
- Prevents reentrant calls with `isGetProjectsRunning` flag
- Watches for `.claude/projects`, `.cursor/chats`, `.codex/sessions` file changes
- Broadcast via WebSocket `projects_updated` event to all clients

**Tool Approval Workflow** (Claude SDK interactive tools)

- Tools requiring approval (AskUserQuestion, etc.) trigger `{ requestId, tool }` sent to frontend
- Frontend prompts user, sends approval back with user input
- Timeout: `CLAUDE_TOOL_APPROVAL_TIMEOUT_MS` (default 55s, configurable)
- See [server/claude-sdk.js](server/claude-sdk.js#L50) for implementation

**Workspace Path Validation**

- `WORKSPACES_ROOT` env var restricts which directories can be opened (security)
- Projects outside root are rejected with 403 error
- Prevents access to system directories

**Service Worker Cache**

- [src/main.jsx](src/main.jsx) unregisters all SWs on app load to prevent stale cache issues

## Integration Points

**Claude SDK** ([server/claude-sdk.js](server/claude-sdk.js))

- Query endpoint: `POST /api/agent/query` with `{ model, messages, tools, stream }`
- Abort endpoint: `POST /api/agent/abort/<sessionId>`
- Session management: `getActiveSessions()` tracks ongoing queries
- Tool approval queue: pending approvals stored by requestId

**Cursor & Codex**

- Both spawned as subprocesses (unlike Claude's direct SDK integration)
- Track active sessions; abort via process signals

**MCP Protocol** ([server/routes/mcp.js](server/routes/mcp.js), [server/utils/mcp-detector.js](server/utils/mcp-detector.js))

- Supports stdio, HTTP, SSE transports
- Auto-detection of MCP in user projects
- Scope: user-level or project-level servers
- Add/remove via `/api/mcp/*` endpoints

**GitHub Integration**

- @octokit/rest for Git operations
- GitHub tokens stored in SQLite (gated behind auth)
- Used for repo cloning and Git commands

**Slash Commands** ([server/routes/commands.js](server/routes/commands.js))

- Markdown files (.md) with YAML frontmatter in user projects
- Model-aware execution (specify which LLM handles the command)

**Model Constants** ([shared/modelConstants.js](shared/modelConstants.js))

- Central source of truth for available Claude, Cursor, Codex models
- Imported by both frontend (UI dropdowns) and backend (SDK calls)
- Update this file to add new models across the app

## Security

**Authentication**

- JWT tokens stored in localStorage (frontend), validated on each API call
- `authenticateToken` middleware enforces JWT signature via `JWT_SECRET` env var
- Token expiry: Configurable; default assumes 24h (set explicitly in auth routes if needed)
- Platform mode bypasses JWT for internal proxy calls

**API Key Validation** (optional, self-hosted)

- `X-API-Key` header or `?apiKey=` query param checked if `API_KEY` env var set
- Stored in `.env`, never logged

**Workspace Path Restrictions**

- All project paths validated against `WORKSPACES_ROOT` (env var)
- Prevents directory traversal attacks
- Forbidden system paths explicitly checked

**Database Security**

- Passwords hashed with bcrypt (20+ salt rounds)
- Database file permissions: readable only by app user
- Sensitive fields (tokens, passwords) never logged

**WebSocket Security**

- Token passed via query param `?token=JWT` or HTTP headers (in server-sent proxy scenarios)
- Broadcast events only contain non-sensitive project metadata
- Personal API keys/GitHub tokens never sent to frontend

## Development Tips

**Debugging**

- Frontend: Use Vue DevTools or React DevTools browser extension
- Backend: Node inspector: `node --inspect server/index.js`, then `chrome://inspect`
- Database: Query directly with sqlite3 CLI: `sqlite3 ~/.cloudcli/auth.db`

**Common Tasks**

- Add a new API endpoint: Create router in [server/routes/](server/routes/), mount in [server/index.js](server/index.js)
- Add a new React component: Place in [src/components/](src/components/) with matching feature folder
- New model support: Add to [shared/modelConstants.js](shared/modelConstants.js), then implement SDK integration
- Environment config: Edit `.env` or update [server/load-env.js](server/load-env.js) defaults

**Testing**

- No automated test suite currently; rely on manual testing and TypeScript compilation
- Run `npm run typecheck` to catch TypeScript errors before commits
