# Cold Call Randomizer

A web application for professors to manage classes, randomly select students for cold calling with an interactive grid-based animation, track call history with scoring, and view student performance statistics.

## Features

- **Secure Authentication**: Email/password authentication with bcrypt password hashing
- **Password Reset**: Email-based password reset flow with secure tokens
- **Class Management**: Create, edit, and manage multiple classes with student rosters
- **CSV Import**: Bulk upload students via CSV files
- **Add Students Anytime**: Add students to existing classes via CSV or manual entry
- **Grid-Based Random Picker**: Students displayed in a grid with cell-hopping animation that randomly highlights names before selection
- **Confetti Celebration**: Celebratory confetti animation when a student is selected
- **Call History**: Track all cold calls with timestamps
- **Student Scoring**: Rate student performance from -2 to +2 with instant local updates and auto-save
- **Statistics Dashboard**: View cumulative scores, average scores, and call frequency per student
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
- Email: `anmolbongirwar@gmail.com`
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

### Using the Cold Call Feature

1. Click on a class from the home page
2. Go to the "Cold Call" tab
3. All students are displayed in a compact grid
4. Click "Spin & Pick" to randomly select a student
5. The grid will animate with cells randomly highlighting (cell-hopping animation)
6. The animation slows down and lands on the selected student
7. Confetti celebration appears when a student is selected
8. The selected student's cell turns green with a banner showing their name
9. The selection is automatically saved to the history

### Scoring Students

1. Navigate to the "History" tab
2. Each cold call has score buttons: -2, -1, 0, +1, +2
3. Click a score to assign it to that cold call
4. Scores update instantly in the UI (local state)
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

When SMTP is not configured:

1. User clicks "Forgot your password?" on login page
2. User enters their email address
3. App generates a reset token and prints the reset URL to the **server console**
4. Copy the URL from console and paste in browser
5. Enter new password

### Production Mode (SMTP Configured)

When SMTP is configured:

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

For production deployment, you should switch from SQLite to PostgreSQL:

### 1. Update `prisma/schema.prisma`

Change the datasource:

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

Build and deploy your application:

```bash
npm run build
npm start
```

## Project Structure

```
cold-call-randomizer/
├── app/
│   ├── (auth)/              # Authentication routes
│   │   ├── login/
│   │   ├── forgot-password/
│   │   └── reset-password/
│   ├── (app)/               # Protected routes
│   │   ├── page.tsx         # Home (classes list)
│   │   └── classes/
│   │       ├── new/         # Create class
│   │       └── [classId]/   # Class detail
│   │           ├── page.tsx # Cold call & history
│   │           ├── edit/    # Edit class
│   │           ├── add-students/ # Add students
│   │           └── stats/   # Statistics
│   ├── layout.tsx
│   └── globals.css
├── components/              # React components
│   ├── ClassDetail.tsx     # Class detail with tabs
│   ├── SlotMachine.tsx     # Grid-based random picker
│   ├── HistoryTab.tsx      # Cold call history with scoring
│   ├── StatsPage.tsx       # Statistics display
│   ├── HomePage.tsx        # Classes list
│   ├── ThemeRegistry.tsx   # MUI theme provider
│   └── LogoutButton.tsx
├── lib/                     # Utilities
│   ├── auth.ts             # Authentication logic
│   ├── db.ts               # Prisma client
│   ├── email.ts            # Email sending
│   ├── theme.ts            # MUI theme configuration
│   └── validators.ts       # Zod schemas
├── prisma/
│   ├── schema.prisma       # Database schema
│   └── seed.ts             # Seed script
├── middleware.ts           # Route protection
├── .env.example            # Environment template
├── package.json
└── README.md
```

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
- [ ] Create a class with both CSV and manual students
- [ ] View all classes on home page
- [ ] Verify student count is correct for each class
- [ ] Upload malformed CSV (should show error)
- [ ] Edit an existing class
- [ ] Change class status to Archived
- [ ] Add students to an existing class via CSV
- [ ] Add students to an existing class manually

### Cold Call Tests

- [ ] Verify all students appear in the grid layout
- [ ] Click "Spin & Pick" to start the animation
- [ ] Verify cell-hopping animation highlights random cells
- [ ] Verify animation slows down before final selection
- [ ] Verify selected student's cell turns green
- [ ] Verify confetti animation appears
- [ ] Verify selected student banner appears
- [ ] Verify selection is saved to history
- [ ] Spin multiple times and verify randomness

### Scoring Tests

- [ ] Score a cold call with -2, -1, 0, +1, +2
- [ ] Verify score button highlights immediately on click
- [ ] Change an existing score
- [ ] Clear a score using the Clear button
- [ ] Verify scores persist after switching tabs
- [ ] Verify scores persist after page refresh (auto-save)

### Statistics Tests

- [ ] View stats page
- [ ] Verify cumulative scores are correct
- [ ] Verify average scores are correct
- [ ] Verify times called count is correct
- [ ] Verify last called date is accurate

## Security Considerations

1. **Default Password**: The default admin password (`1234`) is for development only. Change it immediately!
2. **Session Secret**: Use a strong, random `SESSION_SECRET` in production
3. **HTTPS**: Always use HTTPS in production (cookies are set with `secure` flag in production mode)
4. **Environment Variables**: Never commit `.env` file to version control
5. **Password Reset**: Tokens are hashed and expire after 1 hour

## Troubleshooting

### Database Issues

If you encounter database errors, try:

```bash
npx prisma generate
npx prisma migrate reset
npm run prisma:seed
```

### Port Already in Use

If port 3000 is already in use:

```bash
PORT=3001 npm run dev
```

### SMTP Not Working

Check your SMTP credentials and ensure:
- You're using an App Password (for Gmail)
- The SMTP port is correct (587 for TLS, 465 for SSL)
- Your firewall allows outbound connections

## License

This project is provided as-is for educational purposes.

## Support

For issues or questions, please check the troubleshooting section above or review the code comments.
