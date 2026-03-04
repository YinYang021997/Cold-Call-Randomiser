# Cold Call Randomizer

A web application for professors to manage classes, randomly select students for cold calling with an interactive grid-based animation, track call history with scoring, view student performance statistics, and run team-based cold calls in a full-screen presentation mode.

## Features

- **Secure Authentication**: Email/password authentication with bcrypt password hashing
- **Password Reset**: Email-based password reset flow with secure tokens
- **Class Management**: Create, edit, and manage multiple classes with student rosters
- **CSV Import**: Bulk upload students via CSV files
- **Add Students Anytime**: Add students to existing classes via CSV or manual entry
- **Grid-Based Random Picker**: Full-screen cell-hopping animation that randomly highlights names before landing on the selection — only available in presentation mode
- **Mode Selection**: Choose between Individual Spin or Team Spin each time you enter presentation mode
- **Confetti Celebration**: Celebratory confetti animation when a student is selected
- **Call History**: Track all cold calls with timestamps
- **Student Scoring**: Rate student performance from -2 to +2 with instant local updates and auto-save
- **Statistics Dashboard**: View cumulative scores, average scores, and call frequency per student
- **Team Management**: Create colour-coded teams, assign students via drag-and-drop or list view, and auto-distribute students evenly
- **Full-Screen Presentation Mode**: Distraction-free presenter view with animated team and individual cold-call spinners; mode locked at launch for a focused experience
- **Full-Screen Team Reveal**: When a team is picked, a large animated overlay displays the team name before the member spin begins
- **Test Mode**: Individual spin can run without saving to history — useful for demonstrations
- **Session Mode**: Ensure every team is cold-called exactly once per session; Start/End Session controls available both on the class detail page and inside presentation mode
- **Material Design UI**: Clean, professional interface built with Material UI (MUI)

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Material UI (MUI) + Emotion
- **Database**: SQLite (development) / PostgreSQL (production)
- **ORM**: Prisma
- **Authentication**: Custom JWT-based sessions with bcrypt
- **Email**: Nodemailer (SMTP)
- **Animations**: canvas-confetti
- **Drag & Drop**: @dnd-kit

## Prerequisites

- Node.js 18.0.0 or higher
- npm or yarn

## Setup Instructions

### 1. Clone and Install

```bash
cd cold-call-randomizer
npm install
```

### 2. Environment Configuration

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` and configure the following variables:

```env
# Database
DATABASE_URL="file:./dev.db"

# Session Secret (IMPORTANT: Change this in production!)
SESSION_SECRET="your-random-secret-string-here"

# SMTP Configuration (Optional for development)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
SMTP_FROM="your-email@gmail.com"

# Application Base URL
APP_BASE_URL="http://localhost:3000"
```

**Important Notes:**
- The `SESSION_SECRET` should be a random string. Generate one with: `openssl rand -base64 32`
- SMTP configuration is optional for development. If not configured, password reset links will be printed to the console.
- For Gmail SMTP, you need to use an [App Password](https://support.google.com/accounts/answer/185833)

### 3. Database Setup

Run the database migrations and seed the admin user:

```bash
npm run setup
```

This command will:
1. Generate Prisma client
2. Run database migrations
3. Seed the admin user

**Default Admin Credentials:**
- Email: `teacher@coldcall.app`
- Password: `1234`

⚠️ **SECURITY WARNING**: The default password is `1234`. **Change this immediately** after first login for production use!

### 4. Start the Development Server

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000)

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:seed` - Seed the database
- `npm run prisma:studio` - Open Prisma Studio (database GUI)
- `npm run setup` - Complete setup (generate + migrate + seed)

## Usage Guide

### First Time Setup

1. Navigate to [http://localhost:3000](http://localhost:3000)
2. Login with default credentials (see above)
3. **Immediately change your password** (recommended)
4. Create your first class

### Creating a Class

1. Click "Create Class" on the home page
2. Fill in class details:
   - Name (e.g., "Introduction to Finance")
   - Classroom (e.g., "Room 305")
   - Code (e.g., "FIN101")
   - Timing (e.g., "Weds 10:10–11:30")
   - Dates (e.g., "Jan 22 – May 2, 2026")
3. Optionally add students during creation:
   - **CSV Upload**: Upload a CSV file with columns: `name`, `uni`
   - **Manual Entry**: Click "Add Student Manually" and fill in details
4. Click "Create Class"

### Editing a Class

1. Navigate to the class detail page
2. Click the "Edit Class" button
3. Modify any class details (name, classroom, code, timing, dates, status)
4. Click "Save Changes"

### Adding Students to an Existing Class

1. Navigate to the class detail page
2. Click the "Add Students" button
3. Add students via:
   - **CSV Upload**: Upload a CSV file with `name` and `uni` columns
   - **Manual Entry**: Click "Add Student Manually" for each student
4. Click "Add Students" to save

### CSV Format

Your CSV file should have exactly 2 columns:

```csv
name,uni
John Doe,jd1234
Jane Smith,js5678
Bob Johnson,bj9012
```

### Using Teams

1. Navigate to the **Teams** tab on the class detail page
2. Click "Add Team" to create a colour-coded team
3. Assign students to teams via:
   - **List View** (default): Use the dropdown next to each student
   - **Board View**: Drag and drop student cards between team columns
4. Use "Auto-Distribute" to randomly spread unassigned students evenly across teams

### Presentation Mode

Click **Present** on the class detail page. A dialog appears asking which mode to use:

- **Individual Spin** — Picks a random student from the whole class
- **Team Spin** — First picks a random team, then picks a random member from that team

The mode is locked for the duration of that presentation session, and only the relevant controls are shown.

Press **F11** or use the fullscreen icon to toggle native fullscreen.

#### Individual Spin

- A student grid fills the screen; cells hop rapidly before landing on the winner
- A **Test mode (no save)** toggle in the bottom bar lets you run practice spins without writing anything to history
- Winner is shown in a large banner; the grid cell stays highlighted until the next spin

#### Team Spin

- The team grid animates, then a **full-screen overlay** reveals the selected team name in large text before transitioning to the member spin
- After the member spin, the display stays on the selected team's member grid with the winner highlighted — it does not revert to a list of all students
- Winner banner shows the team name and student name prominently

### Session Mode

Session mode ensures every team gets exactly one cold call before any team is repeated.

**Starting a session:**
- On the class detail page, click **Start Session** (only visible when teams with students exist), or
- Inside presentation (Team Spin), click **Start Session** in the bottom bar

**During a session:**
- Already-called teams are greyed out and crossed through on the idle team grid
- The bottom bar shows **Session: X/Y teams** in green
- Already-called teams are excluded from the TEAM SPIN at both the client and server level
- Once all teams have been called, the button shows **All Teams Called** and is disabled

**Ending a session:**
- Click **End Session (X/Y)** on the class detail page or in the presentation bottom bar
- All teams become eligible again immediately

> Session state is stored in the browser (`localStorage`) under the key `ccr-session-{classId}` and persists across navigation within the same browser session.

### Scoring Students

1. Navigate to the "History" tab
2. Each cold call has score buttons: -2, -1, 0, +1, +2
3. Click a score to assign it to that cold call
4. Scores update instantly in the UI
5. Changes are automatically saved to the server after 2 seconds of inactivity
6. Changes also save when switching browser tabs or leaving the page

### Viewing Statistics

1. Click "Stats" in the class detail page
2. View a table showing:
   - Student name and UNI
   - Number of times called
   - Cumulative score (sum of all scores)
   - Average score
   - Last called date
3. Default sort is by cumulative score (descending)

## Password Reset Flow

### Development Mode (No SMTP Configured)

1. User clicks "Forgot your password?" on login page
2. User enters their email address
3. App generates a reset token and prints the reset URL to the **server console**
4. Copy the URL from console and paste in browser
5. Enter new password

### Production Mode (SMTP Configured)

1. User clicks "Forgot your password?"
2. User enters their email address
3. User receives an email with a reset link (valid for 1 hour)
4. User clicks the link and sets a new password
5. Token is invalidated after use

**Security Features:**
- Tokens are hashed before storage (never stored in plain text)
- Tokens expire after 1 hour
- Tokens can only be used once
- Same success message shown regardless of whether email exists (prevents account enumeration)

## Switching from SQLite to PostgreSQL

For production deployment, switch from SQLite to PostgreSQL:

### 1. Update `prisma/schema.prisma`

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

### 2. Update `.env`

```env
DATABASE_URL="postgresql://username:password@localhost:5432/coldcall?schema=public"
```

### 3. Migrate the Database

```bash
npx prisma migrate dev --name init
npm run prisma:seed
```

### 4. Deploy

```bash
npm run build
npm start
```

## Project Structure

```
cold-call-randomizer/
├── app/
│   ├── (auth)/                  # Unauthenticated routes
│   │   ├── login/
│   │   ├── forgot-password/
│   │   └── reset-password/
│   ├── (app)/                   # Protected routes (require login)
│   │   ├── page.tsx             # Home — list of classes
│   │   └── classes/
│   │       ├── new/             # Create class
│   │       └── [classId]/
│   │           ├── page.tsx     # Class detail (tabs)
│   │           ├── actions.ts   # Server actions (spins, teams, scoring)
│   │           ├── edit/        # Edit class metadata
│   │           ├── add-students/
│   │           ├── present/     # Full-screen presentation route
│   │           └── stats/       # Per-student statistics
│   ├── layout.tsx
│   └── globals.css
├── components/                  # Client components
│   ├── ClassDetail.tsx          # Class detail (History/Teams/Stats tabs) + session controls + mode dialog
│   ├── PresentationView.tsx     # Full-screen spinner — individual mode, team mode, session, test mode
│   ├── SlotMachine.tsx          # (legacy — no longer rendered, kept for reference)
│   ├── TeamsTab.tsx             # Team CRUD, drag-and-drop, auto-distribute
│   ├── HistoryTab.tsx           # Cold call history with inline scoring
│   ├── StatsPage.tsx            # Statistics table
│   ├── HomePage.tsx             # Classes list
│   ├── ThemeRegistry.tsx        # MUI theme provider
│   └── LogoutButton.tsx
├── lib/
│   ├── auth.ts                  # JWT session helpers
│   ├── db.ts                    # Prisma client singleton
│   ├── email.ts                 # Nodemailer email sending
│   ├── theme.ts                 # MUI theme configuration
│   └── validators.ts            # Zod input schemas
├── prisma/
│   ├── schema.prisma            # Database schema
│   └── seed.ts                  # Admin user seed
├── middleware.ts                # Route protection (redirects unauthenticated users)
├── .env.example
├── package.json
└── README.md
```

## Codebase Overview

### Architecture

The app follows the **Next.js 14 App Router** pattern:

- **Server Components** fetch data from the database and pass it as props to Client Components
- **Client Components** (`'use client'`) handle all animation, interactivity, and local state
- **Server Actions** (`'use server'`) in `actions.ts` handle all database mutations — no separate API routes needed
- **Prisma ORM** provides type-safe database access; migrations live in `prisma/migrations/`

### Data Model (key tables)

| Table | Purpose |
|---|---|
| `User` | Teachers — owns classes |
| `Class` | A course with metadata (name, room, code, timing) |
| `Student` | A student belonging to a class; optionally assigned to a team |
| `Team` | A colour-coded group of students within a class |
| `ColdCall` | A record of each spin — stores `studentId`, optional `teamId`, timestamp, and optional score |

A `ColdCall` row is created on every spin (individual or team). Team spins populate both `studentId` and `teamId`.

### Key Components

#### `ClassDetail.tsx`
The main hub for a class. Renders three tabs — History, Teams, Stats — plus header buttons (Present, Start/End Session).

- Clicking **Present** opens a mode-selection dialog (Individual Spin / Team Spin) before navigating to `/present?mode=...`
- Start/End Session buttons appear only when teams with students exist
- Reads session state from `localStorage` on mount so the counter stays in sync after returning from presentation mode

#### `PresentationView.tsx`
Full-screen animated spinner. Receives `initialMode` (`'individual'` | `'team'`) from the URL and locks into that mode for the session.

**Team spin phase machine:**
```
idle → team → team_pause → student → done
```

- `team` — team card grid hops rapidly
- `team_pause` — **full-screen team reveal overlay** (1800 ms) springs in with the team name at up to 8 rem before transitioning to member spin
- `student` — member grid of the selected team hops
- `done` — member grid stays visible with winner highlighted; large winner banner shown

**Individual spin:**
```
idle → (isSpinning=true) → idle
```
A **Test mode** toggle in the bottom bar passes `testMode=true` to the server action, skipping the DB write. The winner banner notes "not saved".

**Session awareness:**
On mount, reads `ccr-session-{classId}` from `localStorage`. `spinEligibleTeams` excludes already-called team IDs. In idle state, the team grid shows all eligible teams with called ones greyed out. After each team spin, the called team ID is appended to `localStorage`. Start/End Session buttons are also available directly in the presentation bottom bar.

#### `TeamsTab.tsx`
Team management UI with two views:
- **List view**: dropdown assignment per student
- **Board view**: drag-and-drop via `@dnd-kit` — visual columns per team

Auto-distribute uses Fisher-Yates shuffle then round-robin assignment.

#### `actions.ts`
All server-side business logic:
- `spinSlotMachineAction(classId, testMode?)` — picks a random student; skips `ColdCall` creation when `testMode=true`
- `spinTeamColdCallAction(classId, excludeTeamIds?)` — picks from teams not in `excludeTeamIds`, picks a member, creates a `ColdCall` with `teamId`
- `createTeamAction`, `updateTeamAction`, `deleteTeamAction` — team CRUD
- `assignStudentToTeamAction` — moves one student to a team
- `autoDistributeStudentsAction` — Fisher-Yates + round-robin bulk assignment
- `updateColdCallScoreAction` — writes score for a past cold call

### Session Mode — How It Works

Session state lives entirely in the browser in `localStorage` under the key `ccr-session-{classId}`:

```json
{ "active": true, "calledTeamIds": ["id1", "id2"] }
```

- **ClassDetail** writes to this key (Start/End Session buttons) and reads it on mount to show the counter
- **PresentationView** reads it on mount, exposes its own Start/End Session buttons, filters `spinEligibleTeams`, and appends to `calledTeamIds` after each team spin
- **Server action** receives `excludeTeamIds` and applies a `notIn` filter at the database level — so even if client state were stale, the server will not re-pick an excluded team

### Animation Architecture

Both spinners follow the same pattern:

1. Start a rapid looping `setTimeout` chain that sets a `highlightedIndex` state on each tick (visual "hopping")
2. Fire the server action **in parallel** (not awaiting before animation starts)
3. When the server result arrives, wait for the current animation cycle to finish, then run 5 final slowing hops that land on the winning index
4. Set the selected state, fire confetti, call `router.refresh()` after 2 s to update history (skipped in test mode)

All timeouts are tracked via `animationRef` (a `useRef`) and cleared on component unmount.

## Manual Test Plan

### Authentication Tests

- [ ] Login with correct credentials
- [ ] Login with incorrect credentials (should fail)
- [ ] Logout successfully
- [ ] Request password reset
- [ ] Reset password with valid token
- [ ] Try to reset password with expired/invalid token (should fail)
- [ ] Try to access protected routes without login (should redirect to login)

### Class Management Tests

- [ ] Create a new class with CSV upload
- [ ] Create a new class with manual student entry
- [ ] View all classes on home page
- [ ] Edit an existing class
- [ ] Change class status to Archived
- [ ] Add students to an existing class via CSV
- [ ] Add students to an existing class manually

### Team Tests

- [ ] Create a team with a name and colour
- [ ] Assign a student to a team via list view dropdown
- [ ] Reassign a student to a different team
- [ ] Drag and drop a student in board view
- [ ] Auto-distribute unassigned students across teams
- [ ] Delete a team (students should become unassigned)

### Presentation Mode Tests

- [ ] Click Present — mode-selection dialog appears with Individual Spin and Team Spin options
- [ ] Team Spin option disabled in dialog when no teams have students
- [ ] Individual Spin: animation lands on a student, selection saved to history
- [ ] Individual Spin: enable Test mode — spin completes but nothing appears in history
- [ ] Individual Spin: Test mode banner shows "not saved"
- [ ] Team Spin: team card grid animates, then full-screen team reveal overlay appears
- [ ] Team reveal overlay shows team name in large text and fades to member spin
- [ ] After team spin, the view stays on the team member grid (not the full student list)
- [ ] Winner banner shows team name prominently above the large student name
- [ ] Toggle F11 fullscreen

### Session Mode Tests

- [ ] Start Session button only appears on class detail when at least one team has students
- [ ] Click Start Session on class detail — button changes to End Session (0/N)
- [ ] Open Team Spin presentation — Start Session button also visible in bottom bar
- [ ] Spin a team — that team is greyed out on the idle grid and excluded from subsequent spins
- [ ] Session counter shows "Session: X/Y teams" in the bottom bar
- [ ] End Session from presentation — all teams become eligible again immediately
- [ ] After all teams are called, TEAM SPIN button shows "All Teams Called" and is disabled
- [ ] End Session from class detail — counter resets

### Scoring Tests

- [ ] Score a cold call with -2, -1, 0, +1, +2
- [ ] Verify score button highlights immediately on click
- [ ] Change an existing score
- [ ] Verify scores persist after page refresh

### Statistics Tests

- [ ] View stats page
- [ ] Verify cumulative and average scores are correct
- [ ] Verify times-called count is correct

## Security Considerations

1. **Default Password**: The default admin password (`1234`) is for development only. Change it immediately!
2. **Session Secret**: Use a strong, random `SESSION_SECRET` in production
3. **HTTPS**: Always use HTTPS in production (cookies are set with `secure` flag in production mode)
4. **Environment Variables**: Never commit `.env` file to version control
5. **Password Reset**: Tokens are hashed and expire after 1 hour

## Troubleshooting

### Database Issues

```bash
npx prisma generate
npx prisma migrate reset
npm run prisma:seed
```

### Port Already in Use

```bash
PORT=3001 npm run dev
```

### SMTP Not Working

- Use an App Password for Gmail
- Check the SMTP port (587 for TLS, 465 for SSL)
- Ensure your firewall allows outbound SMTP connections

## License

This project is provided as-is for educational purposes.

## Support

For issues or questions, please check the troubleshooting section above or review the code comments.
