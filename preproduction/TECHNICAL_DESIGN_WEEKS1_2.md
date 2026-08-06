# CleanSlate Technical Design and Weeks 1-2 Execution Plan

*Engineering source of truth for architecture, contracts, ownership, and integration*

| **Document field** | **Value**                                                   |
|--------------------|-------------------------------------------------------------|
| Project            | CleanSlate                                                  |
| Document type      | Technical design and implementation plan                    |
| Planning period    | Weeks 1-2 foundation, scan pipeline, and review integration |
| Status             | Team review / contract approval                             |
| Version            | 1.1                                                         |
| Date               | August 5, 2026                                              |

> **Relationship to the PRD: The Product Requirements Document defines what CleanSlate should do. This document defines how the four-person team will build it, how code and data move through the system, and what must work by the end of Week 2.**

# Document Map
- 1. Purpose, scope, and Weeks 1-2 objectives
- 2. System architecture and end-to-end data flow
- 3. Repository structure and file ownership
- 4. Shared naming and environment contracts
- 5. Google OAuth and authenticated user flow
- 6. Frontend architecture
- 7. Backend architecture
- 8. Database schema and associations
- 9. Scan lifecycle state machine
- 10. Gmail actions: Keep, Archive, and Move to Trash
- 11. API contracts and normalized response shapes
- 12. Four-person work division and dependencies
- 13. Week 1 daily execution plan
- 14. Week 2 scan pipeline and review execution plan
- 15. Git, pull-request, and contract-change rules
- 16. Definition of done and Weeks 1-2 demonstrations
- Appendices: enums, initial issues, and locked technical decisions

# 1. Purpose, Scope, and Weeks 1-2 Objectives
This document translates the CleanSlate PRD into a concrete engineering plan. It prevents the team from independently inventing route names, model fields, response formats, state names, variable names, or file locations while developing in parallel.

## 1.1 What this document controls
- Frontend and backend architecture.
- Repository paths and primary file ownership.
- Google OAuth, Gmail, database, and AI data flow.
- Database models, associations, constraints, and enums.
- Scan lifecycle states and allowed transitions.
- API route names, request bodies, response shapes, and errors.
- Shared variable names and environment variables.
- Four-person responsibilities, dependencies, merge order, and Weeks 1-2 deadlines.

## 1.2 Weeks 1-2 objectives
By the end of Week 1, the team must have one working authentication and Gmail-data vertical slice-not four disconnected foundations.

```text
Chrome extension
↓
Google OAuth access token
↓
Express authentication middleware
↓
PostgreSQL User find-or-create
↓
Gmail profile + five message previews
↓
Initial Scan record + validated lifecycle transitions
↓
React dashboard
```

> **Week 1 priority:** Real authentication, real database identity, and real Gmail metadata matter more than completing AI classification or polished styling during the first week.

By the end of Week 2, the team must extend that foundation into a complete scan-to-review vertical slice.

```text
Start scan
↓
POST /api/scans returns Scan id
↓
Gmail rule-based candidate query
↓
Protected sender exclusion
↓
ScanItem persistence
↓
AI classification
↓
Scan: ready_for_review
↓
React recommendation review interface
```

> **Week 2 priority: A reliable end-to-end scan pipeline and review interface matter more than analytics, visual polish, or applying Gmail actions. Archive and Move to Trash remain MVP features, but their execution belongs to Week 3.**

# 2. System Architecture and End-to-End Data Flow
## 2.1 System responsibilities
| **System**                    | **Primary responsibilities**                                                                                                                                 |
|-------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Chrome extension (React/Vite) | User interface, Google authorization request, scan controls, progress display, review selections, and cleanup summary.                                       |
| Express backend               | Token validation, user lookup, scan orchestration, rule validation, Gmail coordination, AI coordination, authorization checks, and normalized API responses. |
| PostgreSQL + Sequelize        | Users, protected senders, scan lifecycle, scan items, recommendations, decisions, counts, and safe failure state.                                            |
| Gmail API                     | Profile lookup, message search, message metadata retrieval, archive, and Move to Trash.                                                                      |
| OpenAI API                    | Classification of filtered message metadata into category, recommendation, confidence, and explanation.                                                      |

## 2.2 Full product flow
```text
User connects Gmail
↓
Google returns an access token
↓
Backend verifies Google identity and finds/creates User
↓
User starts scan
↓
Scan: created → fetching
↓
Gmail candidate metadata retrieved
↓
Scan: filtering
↓
Rules + protected sender exclusions applied
↓
Scan: classifying
↓
AI recommendations stored on ScanItems
↓
Scan: ready_for_review
↓
User chooses Keep, Archive, Move to Trash, or Skip
↓
Scan: applying_actions → completed
```

# 3. Repository Structure and File Ownership
CleanSlate will use one GitHub repository with separate frontend and backend applications. A monorepo keeps shared contracts, documentation, pull requests, and integration work visible to the entire team.

```text
CleanSlate/
├── .github/
│ ├── pull_request_template.md
│ └── CODEOWNERS
├── docs/
│ ├── TECHNICAL_DESIGN_WEEKS1_2.md
│ ├── GOOGLE_OAUTH_SETUP.md
│ └── TESTING.md
├── frontend/
│ ├── public/
│ │ ├── manifest.json
│ │ └── icons/
│ ├── src/
│ │ ├── popup/Popup.jsx
│ │ ├── dashboard/Dashboard.jsx
│ │ ├── components/
│ │ │ ├── EmailCard.jsx
│ │ │ ├── ScanProgress.jsx
│ │ │ ├── CleanupSummary.jsx
│ │ │ ├── ProtectedSenderList.jsx
│ │ │ ├── LoadingState.jsx
│ │ │ └── ErrorMessage.jsx
│ │ ├── services/
│ │ │ ├── apiService.js
│ │ │ └── authService.js
│ │ ├── background/serviceWorker.js
│ │ ├── App.jsx
│ │ └── main.jsx
│ ├── .env.example
│ └── package.json
├── backend/
│ ├── src/
│ │ ├── config/env.js
│ │ ├── db/index.js
│ │ ├── models/
│ │ │ ├── User.js
│ │ │ ├── ProtectedSender.js
│ │ │ ├── Scan.js
│ │ │ ├── ScanItem.js
│ │ │ └── index.js
│ │ ├── middleware/
│ │ │ ├── requireGoogleUser.js
│ │ │ ├── errorHandler.js
│ │ │ └── notFound.js
│ │ ├── routes/
│ │ │ ├── healthRoutes.js
│ │ │ ├── userRoutes.js
│ │ │ ├── gmailRoutes.js
│ │ │ ├── scanRoutes.js
│ │ │ └── protectedSenderRoutes.js
│ │ ├── controllers/
│ │ ├── services/
│ │ │ ├── googleUserService.js
│ │ │ ├── gmailService.js
│ │ │ ├── scanService.js
│ │ │ ├── scanStateService.js
│ │ │ └── classificationService.js
│ │ ├── app.js
│ │ └── server.js
│ ├── .env.example
│ └── package.json
├── .gitignore
├── README.md
└── package.json
```

## 3.1 Structural rules
- React components do not call Gmail or OpenAI directly.
- Routes define URLs and middleware; controllers handle HTTP; services contain business logic and external API calls.
- Sequelize models and associations stay in backend/src/models.
- The OpenAI key remains backend-only.
- Only one member edits manifest.json at a time.
- Shared contract files require coordination before changes are merged.

## 3.2 Initial Package Installation and Tailwind CSS

This section adds the packages needed to begin development. It does not change the repository tree above or introduce additional architecture folders. Install packages in the directory that owns them rather than placing all dependencies at the repository root.

### 3.2.1 Installation commands

```bash
# From the CleanSlate repository root
npm install --save-dev concurrently
# Frontend packages (after the Vite React app exists)
cd frontend
npm install
npm install tailwindcss @tailwindcss/vite
# Backend packages
cd ../backend
npm install
npm install express cors dotenv sequelize pg pg-hstore openai zod
npm install --save-dev nodemon
```

### 3.2.2 Package ownership

| **Location**    | **Install**                           | **Purpose**                                                                       |
|-----------------|---------------------------------------|-----------------------------------------------------------------------------------|
| Repository root | concurrently (development dependency) | Optional root helper that starts frontend and backend together.                   |
| frontend        | tailwindcss, @tailwindcss/vite        | Tailwind CSS through the Vite plugin. React and Vite come from the Vite scaffold. |
| backend         | express, cors, dotenv                 | Express API, extension-origin requests, and environment variables.                |
| backend         | sequelize, pg, pg-hstore              | Sequelize ORM and PostgreSQL connection.                                          |
| backend         | openai, zod                           | AI client and validation of structured inputs/outputs.                            |
| backend dev     | nodemon                               | Restarts the Express server during development.                                   |

### 3.2.3 Tailwind CSS setup

Use the Vite plugin approach. These are configuration changes inside the existing frontend application; they do not require expanding the repository scaffold.

#### frontend/vite.config.js

```js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
export default defineConfig({
plugins: [react(), tailwindcss()],
});
```

#### frontend/src/index.css

```css
@import "tailwindcss";
```

Confirm that frontend/src/main.jsx imports ./index.css. After setup, Member 1 should render one Tailwind utility class in the extension shell as the installation check.

### 3.2.4 Package rules

- Commit each changed package.json and its generated package-lock.json.
- Do not install project dependencies globally.
- A pull request that adds a package must identify the package, owning directory, and reason it is needed.
- Do not add Axios, Passport, jsonwebtoken, bcrypt, or googleapis unless the team intentionally changes the locked authentication or API architecture.

# 4. Shared Naming and Environment Contracts
## 4.1 Canonical variable names
| **Use this name** | **Meaning**                                       | **Do not alternate with**     |
|-------------------|---------------------------------------------------|-------------------------------|
| accessToken       | Temporary Google OAuth access token               | token, oauthToken, gmailToken |
| googleSub         | Stable Google account identifier                  | googleId, googleUserId        |
| currentUser       | Authenticated CleanSlate user returned by /api/me | userData, account             |
| scanId            | Internal PostgreSQL Scan primary key              | cleanupId, jobId              |
| scanItemId        | Internal PostgreSQL ScanItem primary key          | itemId, resultId              |
| gmailMessageId    | Gmail message identifier                          | emailId, gmailId, messageId   |
| olderThanDays     | Minimum message age used by filtering             | age, daysOld                  |
| messageLimit      | Maximum candidates for the scan                   | limitCount, maxEmails         |
| recommendedAction | AI recommendation enum                            | suggestion, aiAction          |
| userDecision      | Final user choice                                 | selectedAction, finalAction   |
| actionStatus      | Result of applying a Gmail action                 | operationStatus, result       |

## 4.2 Naming conventions
| **Area**             | **Convention**                  | **Examples**                             |
|----------------------|---------------------------------|------------------------------------------|
| Variables and fields | camelCase                       | googleSub, recommendedAction             |
| React components     | PascalCase                      | EmailCard, ScanProgress                  |
| Sequelize models     | Singular PascalCase             | User, ScanItem                           |
| API routes           | Lowercase plural nouns; hyphens | /api/scans, /api/protected-senders       |
| Branches             | type/task-name                  | feature/google-oauth, fix/duplicate-user |
| Boolean fields       | Question-like names             | isVerified, wasArchived                  |

## 4.3 Environment variables
```dotenv
# frontend/.env.example
VITE_API_URL=http://localhost:8080/api
# backend/.env.example
PORT=8080
DATABASE_URL=
OPENAI_API_KEY=
CHROME_EXTENSION_ORIGIN=chrome-extension://YOUR_EXTENSION_ID
NODE_ENV=development
```

> **Secrets rule:** Commit .env.example, never .env. Access tokens, database credentials, and API keys must not appear in commits, screenshots, logs, Discord messages, or GitHub issues.

# 5. Google OAuth and Authenticated User Flow
## 5.1 MVP authentication decision
The extension obtains a Google access token when the user connects Gmail. The backend validates the token, retrieves the Google identity, and finds or creates the matching CleanSlate user. CleanSlate will not issue a separate JWT during the MVP.

```text
Connect Gmail
↓
chrome.identity.getAuthToken()
↓
Authorization: Bearer <accessToken>
↓
requireGoogleUser middleware
↓
Google identity: sub, email, name, picture
↓
User.findOrCreate({ where: { googleSub } })
↓
req.user + req.googleAccessToken
```

## 5.2 requireGoogleUser responsibilities
> 1\. Read and validate the Bearer header.
>
> 2\. Reject missing or invalid tokens with a normalized 401 response.
>
> 3\. Retrieve the Google identity and verify the email claim.
>
> 4\. Find or create the User using googleSub.
>
> 5\. Update email, displayName, profilePictureUrl, and lastLoginAt.
>
> 6\. Attach the database user to req.user.
>
> 7\. Attach the temporary token to req.googleAccessToken for the current request.

## 5.3 Stored versus temporary data
| **Stored in PostgreSQL**       | **Not stored for the MVP**         |
|--------------------------------|------------------------------------|
| googleSub                      | Google access token                |
| Email and display name         | Google refresh token               |
| Profile picture URL (optional) | Google password                    |
| Protected senders              | Full Gmail inbox                   |
| Scan and ScanItem records      | Attachments or full message bodies |

> **Scheduled scans:** A future scheduled-scan feature would require a separate encrypted refresh-token design. It is not required for the user-triggered MVP flow.

# 6. Frontend Architecture
## 6.1 UI surfaces
| **Surface**               | **Responsibility**                                                                                   |
|---------------------------|------------------------------------------------------------------------------------------------------|
| Popup                     | Entry point, connected account summary, and button to open the full dashboard.                       |
| Dashboard                 | Start scan, show lifecycle progress, render recommendations, collect decisions, and display summary. |
| Protected sender settings | List, add, and remove protected sender email addresses.                                              |
| Service worker            | Extension events and Google authentication operations.                                               |

## 6.2 Frontend state
```text
currentUser
accessToken
activeScan
scanItems
selectedDecisions
protectedSenders
isLoading
error
```

The access token and API request logic should be centralized in authService.js and apiService.js rather than manually passed through many components.

## 6.3 apiService contract
```js
getCurrentUser(accessToken)
getGmailProfile(accessToken)
getMessagePreview(accessToken, limit)
startScan(accessToken, options)
getScan(accessToken, scanId)
submitScanDecisions(accessToken, scanId, decisions)
getRecentScans(accessToken, limit)
getProtectedSenders(accessToken)
addProtectedSender(accessToken, senderEmail)
deleteProtectedSender(accessToken, protectedSenderId)
```

## 6.4 Scan-status display
| **Backend status** | **Frontend behavior**                             |
|--------------------|---------------------------------------------------|
| created            | Preparing your scan…                              |
| fetching           | Retrieving messages from Gmail…                   |
| filtering          | Checking cleanup rules…                           |
| classifying        | Analyzing cleanup candidates…                     |
| ready_for_review   | Display recommendation cards and action controls. |
| applying_actions   | Applying your selections…                         |
| completed          | Display cleanup summary.                          |
| failed             | Display safe error and a start-over option.       |

# 7. Backend Architecture
## 7.1 Request flow
```text
Route
↓
Authentication / validation middleware
↓
Controller
↓
Domain service
↓
Sequelize model or external API
↓
Controller returns normalized response
```

## 7.2 Layer responsibilities
| **Layer**   | **Responsibility**                                                                               |
|-------------|--------------------------------------------------------------------------------------------------|
| Routes      | Declare URL, HTTP method, middleware, and controller.                                            |
| Middleware  | Authentication, validation, not-found handling, and errors.                                      |
| Controllers | Read request data, call services, choose status code, return response.                           |
| Services    | Google identity, Gmail operations, scan orchestration, state transitions, and AI classification. |
| Models      | Schema, constraints, associations, and database persistence.                                     |

## 7.3 Core backend services
| **File**                 | **Primary contract**                                                           |
|--------------------------|--------------------------------------------------------------------------------|
| googleUserService.js     | getGoogleUser(accessToken)                                                     |
| gmailService.js          | getGmailProfile, getMessagePreview, findCleanupCandidates, applyMessageActions |
| scanStateService.js      | transitionScan(scan, nextStatus)                                               |
| scanService.js           | processScan and applyScanDecisions                                             |
| classificationService.js | classifyMessages(messages)                                                     |

# 8. Database Schema and Associations
The MVP uses four models: User, ProtectedSender, Scan, and ScanItem. ScanItem combines limited Gmail metadata, the AI recommendation, the user decision, and the result of applying that decision.

## 8.1 User
| **Field**             | **Type / rule**                      |
|-----------------------|--------------------------------------|
| id                    | INTEGER, primary key, auto-increment |
| googleSub             | STRING, required, unique             |
| email                 | STRING, required                     |
| displayName           | STRING, optional                     |
| profilePictureUrl     | TEXT, optional                       |
| lastLoginAt           | DATE, required                       |
| createdAt / updatedAt | Sequelize timestamps                 |

## 8.2 ProtectedSender
| **Field**             | **Type / rule**                        |
|-----------------------|----------------------------------------|
| id                    | INTEGER, primary key, auto-increment   |
| userId                | INTEGER, required, foreign key         |
| senderEmail           | STRING, required, normalized lowercase |
| createdAt / updatedAt | Sequelize timestamps                   |
| Unique constraint     | userId + senderEmail                   |

## 8.3 Scan
| **Field**     | **Type / rule**                                                                                                                                    |
|---------------|----------------------------------------------------------------------------------------------------------------------------------------------------|
| id / userId   | Primary key and required User foreign key                                                                                                          |
| status        | ENUM, required; begins as created                                                                                                                  |
| olderThanDays | INTEGER, default 15                                                                                                                                |
| messageLimit  | INTEGER, default 25                                                                                                                                |
| Counts        | fetchedCount, candidateCount, protectedCount, analyzedCount, archivedCount, trashedCount, keptCount, reviewCount, failedActionCount; all default 0 |
| Errors        | errorCode STRING and errorMessage TEXT; optional and sanitized                                                                                     |
| Timing        | startedAt optional, completedAt optional, timestamps                                                                                               |

## 8.4 ScanItem
| **Field group**    | **Fields / rule**                                     |
|--------------------|-------------------------------------------------------|
| Identity           | id, scanId, gmailMessageId, threadId                  |
| Email metadata     | senderName, senderEmail, subject, snippet, receivedAt |
| AI output          | category, recommendedAction, confidence, explanation  |
| User/action output | userDecision, actionStatus, actionError               |
| Unique constraint  | scanId + gmailMessageId                               |
| Privacy rule       | No attachment or full message-body storage            |

## 8.5 Associations
```js
User.hasMany(ProtectedSender)
ProtectedSender.belongsTo(User)
User.hasMany(Scan)
Scan.belongsTo(User)
Scan.hasMany(ScanItem)
ScanItem.belongsTo(Scan)
```

Recommended deletion behavior: User → ProtectedSender CASCADE; User → Scan CASCADE; Scan → ScanItem CASCADE.

# 9. Scan Lifecycle State Machine
## 9.1 Main lifecycle
```text
created
↓
fetching
↓
filtering
↓
classifying
↓
ready_for_review
↓
applying_actions
↓
completed
```

Any nonterminal processing state may transition to failed. If no messages qualify after filtering, the scan may move directly from filtering to completed. If the user applies no Gmail-changing actions, ready_for_review may move directly to completed.

## 9.2 Allowed transitions
```js
const allowedTransitions = {
created: ["fetching", "failed"],
fetching: ["filtering", "failed"],
filtering: ["classifying", "completed", "failed"],
classifying: ["ready_for_review", "failed"],
ready_for_review: ["applying_actions", "completed", "failed"],
applying_actions: ["completed", "failed"],
completed: [],
failed: [],
};
```

## 9.3 State rules
- Only the backend changes status.
- Controllers call scanStateService rather than assigning status directly.
- Invalid transitions return 409 SCAN_STATE_CONFLICT.
- completed and failed are terminal for the MVP.
- Starting over creates a new Scan record.
- Before each major operation, the backend persists the next state.
- Counts are saved as stages complete so the UI can show truthful progress.
- AI classification runs only for ScanItems whose recommendation fields are empty.

## 9.4 Orchestration sequence
> 1\. Confirm the scan belongs to the authenticated user.
>
> 2\. Transition created → fetching and retrieve Gmail candidates.
>
> 3\. Save fetchedCount; transition fetching → filtering.
>
> 4\. Apply the Gmail query rules and exclude protected senders.
>
> 5\. Create ScanItem records and save candidate/protected counts.
>
> 6\. Complete immediately if no candidates remain; otherwise transition to classifying.
>
> 7\. Classify unclassified items, persist AI output, and save analyzedCount.
>
> 8\. Transition classifying → ready_for_review.

# 10. Gmail Actions: Keep, Archive, and Move to Trash
| **User action** | **Gmail behavior**          | **Safety behavior**                                     |
|-----------------|-----------------------------|---------------------------------------------------------|
| Keep            | No Gmail modification.      | Records the decision only.                              |
| Archive         | Remove the INBOX label.     | Message remains in All Mail and search.                 |
| Move to Trash   | Call Gmail Trash operation. | Recoverable in Gmail Trash; requires bulk confirmation. |
| Skip / Review   | No Gmail modification.      | Leaves the message unchanged for later review.          |

> **Permanent deletion:** Immediate permanent deletion is not part of the MVP. The UI must say "Move to Trash," not "Permanently Delete."

## 10.1 Action enums
```text
recommendedAction: keep | archive | trash | review
userDecision: keep | archive | trash | skip
actionStatus: pending | successful | failed
```

## 10.2 Applying decisions
```text
ready_for_review
↓
Validate Scan and ScanItems belong to req.user
↓
Save user decisions
↓
Confirm Trash selections in frontend
↓
applying_actions
↓
Archive selected messages
Move selected messages to Trash
↓
Update ScanItem.actionStatus + summary counts
↓
completed
```

# 11. API Contracts and Normalized Responses
## 11.1 Standard success and error shapes
```json
// Success
{
"data": {},
"meta": { "limit": 25, "count": 10 }
}
// Error
{
"error": {
"code": "GOOGLE_TOKEN_INVALID",
"message": "Your Google session has expired.",
"details": null
}
}
```

## 11.2 Route summary
| **Method** | **Route**                   | **Purpose**                                | **Primary owner** |
|------------|-----------------------------|--------------------------------------------|-------------------|
| GET        | /api/health                 | Express/database health check              | Member 3 + 4      |
| GET        | /api/me                     | Validate Google token and find/create User | Member 3 + 4      |
| GET        | /api/gmail/profile          | Retrieve connected Gmail profile           | Member 2 + 3      |
| GET        | /api/gmail/messages/preview | Week 1 message metadata proof              | Member 2 + 1      |
| POST       | /api/scans                  | Create and begin a scan                    | Member 3 + 4      |
| GET        | /api/scans/:scanId          | Return status, counts, and items           | Member 3 + 1      |
| POST       | /api/scans/:scanId/actions  | Apply Keep/Archive/Trash/Skip decisions    | Member 3 + 2      |
| GET        | /api/scans                  | Return recent scan summaries               | Member 3 + 4      |
| GET        | /api/protected-senders      | List current user's protected senders      | Member 4 + 1      |
| POST       | /api/protected-senders      | Add protected sender                       | Member 4 + 1      |
| DELETE     | /api/protected-senders/:id  | Remove protected sender                    | Member 4 + 1      |

## 11.3 Week 1 response contracts
GET /api/me

```json
{
"data": {
"user": {
"id": 7,
"email": "student@gmail.com",
"displayName": "Example Student",
"profilePictureUrl": "https://...",
"lastLoginAt": "2026-08-05T16:00:00.000Z"
}
}
}
```

GET /api/gmail/messages/preview?limit=5

```json
{
"data": {
"messages": [{
"gmailMessageId": "18f123abc",
"threadId": "18f123abc",
"sender": {
"name": "Example Sender",
"email": "sender@example.com"
},
"subject": "Example subject",
"receivedAt": "2026-08-01T14:30:00.000Z",
"snippet": "Limited Gmail preview...",
"labels": ["INBOX", "UNREAD"]
}]
},
"meta": { "limit": 5, "count": 1 }
}
```

## 11.4 Scan action request
```text
POST /api/scans/:scanId/actions
{
"decisions": [
{ "scanItemId": 101, "decision": "archive" },
{ "scanItemId": 102, "decision": "trash" },
{ "scanItemId": 103, "decision": "keep" }
]
}
```

# 12. Four-Person Work Division and Dependencies
Roles are divided by primary ownership, but every member contributes to the same vertical slice. Ownership means the member leads and reviews that area; it does not mean isolated development.

| **Member**                      | **Primary ownership**                                                                  | **Week 1 outcome**                                                     |
|---------------------------------|----------------------------------------------------------------------------------------|------------------------------------------------------------------------|
| Member 1 - Frontend             | Popup, dashboard, components, apiService, progress UI, error/loading states.           | Authenticated user and five Gmail previews displayed in the extension. |
| Member 2 - Google/Gmail         | manifest, fixed extension ID, OAuth, authService, service worker, gmailService.        | Valid access token; Gmail profile and message metadata retrieved.      |
| Member 3 - Express/scan/AI      | Routes, controllers, middleware, googleUserService, scan orchestration, state service. | Authenticated API request and operational scan transition foundation.  |
| Member 4 - Database/integration | PostgreSQL, Sequelize, models, associations, constraints, integration tests.           | No duplicate users; Scan and ScanItem lifecycle persisted correctly.   |

## 12.1 Primary file boundaries
| **Owner** | **Primary paths**                                                                                                                        |
|-----------|------------------------------------------------------------------------------------------------------------------------------------------|
| Member 1  | frontend/src/{popup, dashboard, components}; frontend/src/services/apiService.js                                                         |
| Member 2  | frontend/public/manifest.json; frontend/src/{services/authService.js, background/serviceWorker.js}; backend/src/services/gmailService.js |
| Member 3  | backend/src/{routes, controllers, middleware, services}; service contracts listed in Section 7.3                                         |
| Member 4  | backend/src/{db, models}; database integration tests                                                                                     |

## 12.2 Integration dependency chain
```text
Member 1: Connect button
↓
Member 2: Google access token
↓
Member 3: requireGoogleUser
↓
Member 4: User find-or-create
↓
Member 3: create Scan + transition service
↓
Member 2: Gmail metadata
↓
Member 4: ScanItem persistence
↓
Member 1: display real data and lifecycle
```

## 12.3 Recommended merge order
> 1\. Repository foundation and shared documentation.
>
> 2\. React/Vite and Express starter applications.
>
> 3\. Database connection and User model.
>
> 4\. Google Cloud project, fixed extension ID, and OAuth configuration.
>
> 5\. Extension access-token retrieval.
>
> 6\. Backend Google authentication and User find-or-create.
>
> 7\. Gmail profile retrieval.
>
> 8\. Gmail message-preview retrieval.
>
> 9\. Scan and ScanItem models.
>
> 10\. Scan transition service.
>
> 11\. React integration of authenticated user, Gmail previews, and scan state.

# 13. Week 1 Daily Execution Plan
## Day 1 - Foundation and contracts
| **Member 1**                                            | **Member 2**                                                             | **Member 3**                              | **Member 4**                                              |
|---------------------------------------------------------|--------------------------------------------------------------------------|-------------------------------------------|-----------------------------------------------------------|
| Create React/Vite shell; verify extension page renders. | Create Google Cloud project; begin fixed extension-ID and consent setup. | Create Express shell and GET /api/health. | Create PostgreSQL/Neon database and Sequelize connection. |

**Team checkpoint:** repository exists; frontend starts; backend starts; database authenticates; contracts and file ownership are approved.

## Day 2 - Independent foundations
| **Member 1**                                                        | **Member 2**                                                         | **Member 3**                                              | **Member 4**                                                  |
|---------------------------------------------------------------------|----------------------------------------------------------------------|-----------------------------------------------------------|---------------------------------------------------------------|
| Connect Gmail screen, mock dashboard, loading and error components. | Add test users, manifest OAuth settings, and access-token retrieval. | CORS, normalized errors, and requireGoogleUser structure. | User model; draft ProtectedSender, Scan, and ScanItem models. |

**Team checkpoint:** Connect Gmail returns a token; frontend calls Express; User table exists.

## Day 3 - Authentication integration
| **Member 1**                                   | **Member 2**                                           | **Member 3**                                             | **Member 4**                                          |
|------------------------------------------------|--------------------------------------------------------|----------------------------------------------------------|-------------------------------------------------------|
| Call /api/me and display connected-user state. | Supply token flow and troubleshoot extension identity. | Validate token; populate req.user and normalized errors. | Implement User.findOrCreate and duplicate-user tests. |

**Required tests:** first login creates one User; second login returns the same User; another Gmail account creates another User; missing/invalid token returns 401; no token is stored.

## Day 4 - Gmail retrieval integration
| **Member 1**                                 | **Member 2**                                                         | **Member 3**                                                 | **Member 4**                                                          |
|----------------------------------------------|----------------------------------------------------------------------|--------------------------------------------------------------|-----------------------------------------------------------------------|
| Render Gmail profile and five preview cards. | Implement profile, message list, and message metadata normalization. | Create profile/preview controllers and authorization checks. | Support integration tests and verify no unintended email persistence. |

**Team checkpoint:** five real Gmail previews appear in the extension.

## Day 5 - Scan foundation and reliability
| **Member 1**                                                         | **Member 2**                                             | **Member 3**                                         | **Member 4**                                                               |
|----------------------------------------------------------------------|----------------------------------------------------------|------------------------------------------------------|----------------------------------------------------------------------------|
| Build ScanProgress against mock/real states; finalize error screens. | Document OAuth/Gmail setup; test every approved account. | Implement transitionScan and initial Scan endpoints. | Finalize Scan/ScanItem models, constraints, associations, and state tests. |

**End-of-week result:** authentication, database identity, Gmail metadata, initial scan persistence, validated transitions, and React display all work together.

# 14. Week 2 Scan Pipeline and Review Execution Plan

Week 2 converts the Week 1 authentication and Gmail proof into the core CleanSlate experience. The required stopping point is ready_for_review: qualifying messages have been filtered, protected senders have been excluded, AI recommendations have been persisted, and the user can review the results. Gmail actions are applied during Week 3.

```text
Connect Gmail
↓
Start Scan
↓
created → fetching → filtering
↓
Create eligible ScanItems
↓
classifying
↓
Persist structured AI output
↓
ready_for_review
↓
Recommendation cards in React
```

## 14.1 Week 2 scope and exit criteria

- POST /api/scans creates a Scan in created and returns 202 Accepted with the Scan id.
- The backend runs the Gmail query, state transitions, protected-sender exclusion, ScanItem persistence, and AI classification.
- The default Gmail query finds unread messages older than olderThanDays that are not starred or marked important.
- Each scan retrieves at most 25 raw Gmail matches; protected-sender filtering may reduce the analyzed count below 25.
- Protected sender list, add, and remove operations work for the authenticated user.
- The AI returns one validated category, recommendation, confidence level, and explanation for each eligible ScanItem.
- GET /api/scans/:scanId returns truthful status, counts, and recommendations without rerunning the scan.
- The extension polls the active scan and displays recommendation cards when it reaches ready_for_review.
- Archive and Move to Trash controls may be visible for selection design, but Gmail modifications are not applied until Week 3.

## 14.2 Locked Week 2 technical contracts

| **Contract**           | **Locked decision**                                                                          | **Primary owner** |
|------------------------|----------------------------------------------------------------------------------------------|-------------------|
| Default Gmail query    | is:unread older_than:\${olderThanDays}d -is:starred -is:important                            | Member 2          |
| Candidate cap          | Request at most 25 raw Gmail matches per scan for the MVP.                                   | Member 2 + 3      |
| Protected sender match | Exact lowercased sender email; domain-level rules remain a stretch goal.                     | Member 4 + 3      |
| ScanItem creation      | Create only after rule filtering and protected-sender exclusion.                             | Member 3 + 4      |
| AI batching            | Classify chunks of at most 10 items with strict structured output and one validation retry.  | Member 3          |
| Scan processing        | POST returns 202; processScan continues in the same Express process for the capstone.        | Member 3          |
| Progress polling       | Poll GET /api/scans/:scanId every 2 seconds; stop at ready_for_review, completed, or failed. | Member 1          |
| Active scan rule       | One nonterminal scan per user; return 409 ACTIVE_SCAN_EXISTS with the existing scanId.       | Member 3 + 4      |
| Week 2 stopping point  | ready_for_review; applying_actions and completed action summaries are Week 3.                | Entire team       |

## 14.3 Week 2 route, service, and path contracts

| **Area**          | **Required path or function**                   | **Week 2 responsibility**                                                     | **Owner**    |
|-------------------|-------------------------------------------------|-------------------------------------------------------------------------------|--------------|
| Frontend          | frontend/src/dashboard/Dashboard.jsx            | Start/resume scan and switch between progress and review.                     | Member 1     |
| Frontend          | frontend/src/components/ScanProgress.jsx        | Map backend status to user-facing progress text.                              | Member 1     |
| Frontend          | frontend/src/components/EmailCard.jsx           | Render recommendation, confidence, explanation, and future decision controls. | Member 1     |
| Frontend          | frontend/src/components/ProtectedSenderList.jsx | List, add, and remove protected senders.                                      | Member 1     |
| Frontend          | frontend/src/services/apiService.js             | startScan, getScan, and protected-sender requests.                            | Member 1     |
| Gmail             | backend/src/services/gmailService.js            | findCleanupCandidates and normalized sender/message metadata.                 | Member 2     |
| Scan              | backend/src/services/scanService.js             | processScan orchestration and idempotency checks.                             | Member 3     |
| AI                | backend/src/services/classificationService.js   | Structured classification, chunking, validation, and retry.                   | Member 3     |
| Database          | backend/src/models/Scan.js and ScanItem.js      | Persist status, counts, metadata, and recommendations.                        | Member 4     |
| Protected senders | protectedSenderRoutes/controller/service        | Authenticated CRUD and ownership enforcement.                                 | Member 3 + 4 |

## 14.4 Daily execution plan

## Day 6 - Rule-based scan foundation

| **Member 1**                                                                                 | **Member 2**                                                                                                          | **Member 3**                                                                                                      | **Member 4**                                                                                             |
|----------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------|
| Connect the real Start Scan button to startScan(); store activeScan and render ScanProgress. | Implement the Gmail cleanup query, maxResults cap, header extraction, sender parsing, and normalized candidate shape. | Implement POST /api/scans, return 202, and build the processScan skeleton through created → fetching → filtering. | Finalize Scan/ScanItem fields, constraints, helper queries, and test fixtures for real scan persistence. |

**Team checkpoint:** a real scan can be created, Gmail candidates can be retrieved, status reaches filtering, and eligible ScanItems can be persisted without AI output.

## Day 7 - Protected sender workflow

| **Member 1**                                                                            | **Member 2**                                                                            | **Member 3**                                                                                      | **Member 4**                                                                                                     |
|-----------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------|
| Build ProtectedSenderList with list, add, remove, loading, duplicate, and error states. | Finalize sender-email normalization and provide representative Gmail sender test cases. | Implement protected-sender routes/controllers and integrate exclusion into processScan filtering. | Implement ProtectedSender persistence, lowercase normalization, unique constraint, ownership queries, and tests. |

**Team checkpoint:** a protected sender is excluded from the current user's scan, protectedCount increases, and another user cannot read or modify that rule.

## Day 8 - AI classification and persistence

| **Member 1**                                                                                                                      | **Member 2**                                                                                                     | **Member 3**                                                                                                                           | **Member 4**                                                                                                                    |
|-----------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------|
| Build recommendation-card states using the locked ScanItem response shape; display category, action, confidence, and explanation. | Verify the classifier payload contains only normalized sender, subject, snippet, receivedAt, and gmailMessageId. | Implement classificationService, structured schema, chunk size 10, response validation, one retry, and classifying → ready_for_review. | Persist AI fields on the correct ScanItems; test unique ids, null-to-populated updates, and no duplicate recommendation writes. |

**Team checkpoint:** eligible real Gmail messages receive validated AI recommendations that are stored in PostgreSQL and returned through the scan endpoint.

## Day 9 - Progress polling and full integration

| **Member 1**                                                                                                        | **Member 2**                                                                                                                | **Member 3**                                                                                                          | **Member 4**                                                                                                                      |
|---------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------|
| Poll getScan() every 2 seconds, map lifecycle states, stop polling correctly, and render items at ready_for_review. | Map Google/Gmail failures into safe service errors and test expired permission, empty inbox, and malformed sender metadata. | Complete GET /api/scans/:scanId, active-scan conflict behavior, orchestration error handling, and idempotency guards. | Add user-scoped scan queries, count verification, failed-state persistence, and tests that repeated GET calls do not change data. |

**Team checkpoint:** Connect Gmail → Start Scan → lifecycle progress → AI recommendations works end to end without manually refreshing the extension.

## Day 10 - Review interface, edge cases, and Week 2 freeze

| **Member 1**                                                                                                                  | **Member 2**                                                                                                | **Member 3**                                                                                                  | **Member 4**                                                                                                 |
|-------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------|
| Finish the review interface, selection state for Week 3 actions, empty results, failed scan, and resume-active-scan behavior. | Test the demo inbox with newsletters, promotions, notifications, important messages, and protected senders. | Harden classification parsing, normalized errors, no-candidate completion, and active-scan recovery response. | Run integration tests, inspect persisted records/counts, verify privacy limits, and document database setup. |

**Team checkpoint:** feature freeze for the Week 2 scan-to-review slice. The team fixes integration defects and documents setup instead of adding new features.

## 14.5 Week 2 dependency and merge order

> 1\. Merge the Gmail query and normalized candidate contract.
>
> 2\. Merge final Scan, ScanItem, and ProtectedSender persistence contracts.
>
> 3\. Merge POST /api/scans with a mock classifier so the frontend can integrate early.
>
> 4\. Merge protected-sender CRUD and scan exclusion.
>
> 5\. Replace the mock classifier with the validated AI service.
>
> 6\. Merge GET /api/scans/:scanId, active-scan checks, and failure persistence.
>
> 7\. Merge frontend polling and lifecycle progress.
>
> 8\. Merge the real recommendation review interface.
>
> 9\. Run the full test matrix and freeze Week 2 behavior.

> **Integration rule: Member 1 should not wait for every backend feature to finish. Member 3 must provide the locked response mocks early, then replace mock data with real Gmail and AI results without changing the frontend contract.**

## 14.6 Week 2 test matrix

| **Scenario**             | **Expected result**                                                                              | **Primary test owner** |
|--------------------------|--------------------------------------------------------------------------------------------------|------------------------|
| Normal scan              | Transitions to ready_for_review; counts and recommendation items are returned.                   | Member 3 + 4           |
| No matching messages     | filtering → completed with analyzedCount 0 and an empty result.                                  | Member 2 + 3           |
| All matches protected    | protectedCount reflects exclusions; scan completes without an AI call.                           | Member 4 + 3           |
| AI response invalid once | Classification validates, retries once, and succeeds or safely fails.                            | Member 3               |
| AI unavailable           | Scan becomes failed with AI_CLASSIFICATION_FAILED and no duplicate calls.                        | Member 3 + 4           |
| Google token invalid     | Request/scan fails safely with normalized authentication messaging.                              | Member 2 + 3           |
| Second scan while active | 409 ACTIVE_SCAN_EXISTS includes the existing scanId for resume behavior.                         | Member 3 + 4           |
| Repeated status polling  | Returns existing state/items and never reruns Gmail or AI work.                                  | Member 1 + 3           |
| Other user's scan id     | No scan data is exposed; ownership enforcement returns the normalized not-found/access response. | Member 3 + 4           |

# 15. Git, Pull-Request, and Contract-Change Rules
## 15.1 Branch workflow
```bash
git checkout main
git pull origin main
git checkout -b feature/task-name
# work, test, commit, push
# open PR → review → squash and merge → delete branch
```

## 15.2 Pull-request rules
- No direct pushes to main.
- Every PR addresses one focused issue.
- Every PR requires at least one approval from another member.
- Authentication, model, state-machine, and API-contract changes require owner review.
- The author tests locally, removes unnecessary logs, checks secrets, and updates documentation.
- Use Squash and merge.

## 15.3 Contract changes
A member may not silently change route names, request bodies, response shapes, model fields, enum values, authentication headers, state names, or allowed transitions.

> 1\. Tell the affected team members.
>
> 2\. Agree on the change before implementation.
>
> 3\. Update this document and mock data.
>
> 4\. Update frontend, backend, and tests in coordinated PRs.

## 15.4 Pull-request checklist
- [ ] Related issue is linked.
- [ ] Application runs locally.
- [ ] Feature and failure path were tested.
- [ ] No access tokens or secrets were committed or logged.
- [ ] Contract changes are explicitly identified.
- [ ] Documentation is updated.

# 16. Definition of Done and Weeks 1-2 Demonstrations
## 16.1 Feature definition of done
- Matches the agreed contract and file location.
- Happy path works and expected failures are handled.
- Authorization and ownership checks are present where required.
- No secrets, tokens, or raw external errors are exposed.
- Another team member can run and test the feature.
- PR is reviewed, merged, and does not break the integrated application.

## 16.2 Week 1 definition of done
- [ ] Repository contains working frontend and backend applications.
- [ ] Unpacked Chrome extension loads with a consistent extension ID.
- [ ] All four team members and the demo account are OAuth test users.
- [ ] React communicates with Express; Express communicates with PostgreSQL.
- [ ] Connect Gmail produces a valid Google access token.
- [ ] Express validates Google identity and creates/fetches the correct User.
- [ ] Repeated login does not create a duplicate User.
- [ ] Gmail profile and five real message previews are displayed.
- [ ] A Scan starts in created and valid state transitions persist.
- [ ] Invalid transitions return 409 SCAN_STATE_CONFLICT.
- [ ] Tokens are not stored in PostgreSQL or committed to GitHub.
- [ ] A teammate can clone and run the project using the README.

## 16.3 Week 1 demonstration script
> 1\. Load the CleanSlate extension.
>
> 2\. Click Connect Gmail and complete Google OAuth.
>
> 3\. Show the CleanSlate User created in PostgreSQL.
>
> 4\. Retrieve and display the Gmail profile.
>
> 5\. Display five Gmail message previews.
>
> 6\. Create a new Scan in the created state.
>
> 7\. Show valid state transitions.
>
> 8\. Attempt an invalid transition and show the normalized 409 error.
>
> 9\. Reconnect the same Gmail account and confirm that no duplicate User was created.

## 16.4 Week 2 definition of done

- [ ] POST /api/scans returns 202 with a user-owned Scan id.
- [ ] The scan persists created, fetching, filtering, classifying, and ready_for_review transitions.
- [ ] The Gmail query applies unread, age, starred, important, and message-limit rules.
- [ ] Protected sender list, add, remove, normalization, duplicate handling, and ownership checks work.
- [ ] Protected senders are excluded before ScanItems are created or sent to the AI.
- [ ] ScanItems contain limited metadata only; no attachments, full bodies, or access tokens are stored.
- [ ] AI output follows the locked enums and includes one result for every classified ScanItem.
- [ ] Classification runs in chunks of at most 10 and does not rerun populated items.
- [ ] GET /api/scans/:scanId returns progress, counts, and recommendations without changing state.
- [ ] The frontend polls every 2 seconds and stops at ready_for_review, completed, or failed.
- [ ] The review interface displays sender, subject, date, category, recommendation, confidence, and explanation.
- [ ] No-candidate, all-protected, token failure, Gmail failure, and AI failure paths are handled safely.
- [ ] A second scan while one is active returns ACTIVE_SCAN_EXISTS and lets the frontend resume the existing scan.
- [ ] Another team member can clone, configure, and demonstrate the full scan-to-review flow.

## 16.5 Week 2 demonstration script

> 1\. Connect the dedicated CleanSlate demo Gmail account.
>
> 2\. Open protected sender settings and add one known sender.
>
> 3\. Start a scan and show the Scan record created in PostgreSQL.
>
> 4\. Show the dashboard progress through fetching, filtering, and classifying.
>
> 5\. Confirm the protected sender is excluded and protectedCount is updated.
>
> 6\. Show the Scan reaching ready_for_review.
>
> 7\. Display real recommendation cards with category, action, confidence, and explanation.
>
> 8\. Refresh or reopen the extension and show that the same Scan is retrieved instead of rerun.
>
> 9\. Attempt to start a second scan and show the normalized active-scan response.
>
> 10\. Confirm that no Gmail messages were archived or moved to Trash during the Week 2 demonstration.

# Appendix A - Canonical Enums
| **Contract**               | **Allowed values**                                                                               |
|----------------------------|--------------------------------------------------------------------------------------------------|
| Scan.status                | created, fetching, filtering, classifying, ready_for_review, applying_actions, completed, failed |
| ScanItem.category          | important, promotional, newsletter, automated_notification, low_priority, needs_review           |
| ScanItem.recommendedAction | keep, archive, trash, review                                                                     |
| ScanItem.confidence        | high, medium, low                                                                                |
| ScanItem.userDecision      | keep, archive, trash, skip                                                                       |
| ScanItem.actionStatus      | pending, successful, failed                                                                      |

# Appendix B - Initial GitHub Issues
> 1\. Create CleanSlate repository foundation.
>
> 2\. Build Chrome extension shell.
>
> 3\. Configure Google OAuth and Gmail API.
>
> 4\. Build Express authentication middleware.
>
> 5\. Configure PostgreSQL and Sequelize.
>
> 6\. Create User and ProtectedSender models.
>
> 7\. Create Scan and ScanItem models.
>
> 8\. Implement scan state-transition service.
>
> 9\. Retrieve Gmail profile and message preview.
>
> 10\. Integrate authenticated Gmail data into React.

Each issue must identify one owner, relevant paths, dependencies, test instructions, and a concrete definition of done.

**Week 2 issues:**

> 1\. Implement the rule-based Gmail candidate query and normalized message shape.
>
> 2\. Build authenticated protected-sender CRUD.
>
> 3\. Exclude protected senders before ScanItem creation.
>
> 4\. Implement asynchronous processScan orchestration and lifecycle persistence.
>
> 5\. Implement structured AI classification with chunking, validation, and retry.
>
> 6\. Persist AI output on ScanItems without duplicate classification.
>
> 7\. Implement active-scan detection and resume behavior.
>
> 8\. Build scan-status polling and progress-state UI.
>
> 9\. Build the recommendation review interface.
>
> 10\. Complete the Week 2 test matrix and update setup documentation.

# Appendix C - Locked Technical Decisions and Remaining Questions
| **Decision**                 | **Locked Weeks 1-2 position**                                                                |
|------------------------------|----------------------------------------------------------------------------------------------|
| Scan processing response     | POST /api/scans returns 202 with Scan id; processScan continues in the same Express process. |
| Progress updates             | Frontend polls GET /api/scans/:scanId every 2 seconds while processing.                      |
| Candidate cap                | Gmail returns at most 25 raw matches; filtering may reduce analyzedCount.                    |
| ScanItem creation point      | Create after rule filtering and protected-sender exclusion.                                  |
| Protected sender matching    | Exact normalized lowercase email only for the MVP.                                           |
| AI batching                  | Classify chunks of at most 10 with structured output and one validation retry.               |
| Active scan behavior         | Return 409 ACTIVE_SCAN_EXISTS with existing scanId and resume that scan.                     |
| Week 2 completion state      | Stop the Week 2 slice at ready_for_review; Gmail modifications are Week 3.                   |
| Partial Gmail action failure | Week 3 will mark each ScanItem actionStatus independently and summarize failures.            |
| Failed scan retry            | Create a new Scan instead of resuming a failed terminal scan during the MVP.                 |

> **Approval gate: Once the team approves this document, the Weeks 1-2 contracts are locked. Any remaining Week 3 questions must be resolved before members build code that depends on them.**
