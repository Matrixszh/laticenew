# Platform Architecture

## Two Separate Platforms

### 1. Public Platform (Marketing & Onboarding)
**Routes:** `/`, `/onboarding`
- **Purpose:** Customer-facing marketing and sign-up
- **Access:** Always public, no authentication required
- **Features:**
  - Landing page with Lattice branding
  - Product features and benefits
  - Multi-step onboarding form
  - Collects: Company name, email, phone, industry, use case, team size, expected volume, notes

### 2. Admin Platform (Setup & Dashboard)
**Routes:** `/setup`, `/app/*`
- **Purpose:** Internal admin dashboard and configuration
- **Access:** Requires authentication (Clerk) when configured
- **Features:**
  - Setup wizard for environment configuration
  - KPIs dashboard
  - Leads management (shows onboarding form submissions)
  - Interactions tracking
  - Calendar management
  - Automation rules
  - Settings

## Data Flow: Where Onboarding Data Appears

### Onboarding Form Submission Flow:

1. **User fills out form** at `/onboarding` (Public Platform)
2. **Form submits to** `POST /api/onboarding`
3. **Data is stored in Airtable** `Leads` table with fields:
   - `Name` (company name)
   - `Email`
   - `Phone`
   - `Status` (set to "New")
   - `Industry`
   - `Use Case`
   - `Team Size`
   - `Expected Volume`
   - `Onboarding Notes`
4. **Data appears in Admin Platform** at `/app/leads` (Dashboard)

### Viewing Onboarding Data:

- **Admin Dashboard → Leads Page** (`/app/leads`)
  - Shows all leads from onboarding forms
  - Displays: Name, Email, Phone, Status, Industry, Use Case, Created date
  - Leads are sorted by creation date (newest first)
  - Status can be updated: New → Contacted → Qualified → Closed/Lost

### If Airtable Not Configured:

- Onboarding form still works (submits successfully)
- Data is logged to console
- Once Airtable is configured, future submissions will be stored
- Historical data can be manually imported if needed

## UI Improvements Made

### Design Enhancements:
- ✅ Added Lattice logo (SVG) to all pages
- ✅ Modern, clean design with better spacing and typography
- ✅ Improved color scheme (black/white with accent colors)
- ✅ Better mobile responsiveness
- ✅ Smooth transitions and hover effects
- ✅ Professional gradient backgrounds
- ✅ Clear visual hierarchy

### Platform Separation:
- ✅ Public platform (`/`, `/onboarding`) - Marketing-focused, no auth
- ✅ Admin platform (`/setup`, `/app/*`) - Dashboard-focused, requires auth
- ✅ Clear navigation separation
- ✅ Different branding/feel for each platform

### Onboarding Form:
- ✅ Multi-step wizard (4 steps)
- ✅ Progress indicator
- ✅ Form validation
- ✅ Success state with next steps
- ✅ Stores all data in Airtable Leads table

## File Structure

```
app/
├── page.tsx                    # Public: Landing/Marketing page
├── onboarding/
│   └── page.tsx               # Public: Onboarding form
├── setup/
│   └── page.tsx               # Admin: Setup wizard
└── app/                        # Admin: Dashboard
    ├── kpis/
    ├── leads/                  # Shows onboarding form data
    ├── interactions/
    ├── automations/
    ├── calendar/
    └── settings/

api/
├── onboarding/
│   └── route.ts               # Stores onboarding form data
└── leads/
    └── route.ts               # Returns leads (including onboarding)
```

## Access Points

### Public Platform (No Auth Required):
- http://localhost:3000/ - Landing page
- http://localhost:3000/onboarding - Onboarding form

### Admin Platform (Auth Required):
- http://localhost:3000/setup - Setup wizard
- http://localhost:3000/app - Dashboard (redirects to KPIs)
- http://localhost:3000/app/leads - **View onboarding form submissions here**
- http://localhost:3000/app/kpis - KPIs dashboard
- http://localhost:3000/app/interactions - Interactions
- http://localhost:3000/app/automations - Automation rules
- http://localhost:3000/app/calendar - Calendar
- http://localhost:3000/app/settings - Settings

