# Onboarding Configuration Improvements

## What Changed

### ✅ Added Onboarding Table
- **Before**: Only `Leads` table was populated
- **After**: Data is now written to **both** `Onboarding` and `Leads` tables

### ✅ Automatic Business Record Creation
- When a new company submits the onboarding form, a `Business` record is automatically created
- If a business with the same name already exists, it links to the existing record
- Default timezone is set to `America/New_York` (can be updated later)

### ✅ Enhanced Data Flow

**Onboarding Form Submission →**
1. **Onboarding Table** (primary storage)
   - Stores complete onboarding form data
   - Status: "New" (can be updated to Contacted, Converted, Archived)
   
2. **Businesses Table** (auto-created)
   - Creates business record if it doesn't exist
   - Links to the onboarding/lead data
   
3. **Leads Table** (for dashboard)
   - Creates lead record for dashboard visibility
   - Links to the business record
   - Status: "New"

### ✅ Improved Validation
- All fields are now required: Company Name, Email, Industry, Use Case, Team Size, Expected Volume
- Phone and Notes remain optional

## Schema Updates

### New Onboarding Table Structure:
```
Onboarding
├── Company Name (required)
├── Email (required)
├── Phone (optional)
├── Industry (required)
├── Use Case (required)
├── Team Size (required)
├── Expected Volume (required)
├── Onboarding Notes (optional)
├── Status (required) - New, Contacted, Converted, Archived
└── Created (auto-generated)
```

## Benefits

1. **Better Data Organization**
   - Onboarding data is separate from lead management
   - Clear distinction between sign-ups and active leads

2. **Automatic Business Setup**
   - No manual business creation needed
   - Businesses are ready for appointments and automations

3. **Complete Data Capture**
   - All onboarding fields are required (except phone/notes)
   - Ensures quality data from the start

4. **Dual Storage**
   - Onboarding table: Historical sign-up data
   - Leads table: Active lead management
   - Both stay in sync

## Next Steps

1. **Create Onboarding Table in Airtable**
   - Follow `AIRTABLE_SETUP_GUIDE.md` to create the table
   - Use the schema from `docs/airtable-schema.md`

2. **Test the Flow**
   - Submit onboarding form
   - Verify records appear in:
     - Onboarding table
     - Businesses table (new record created)
     - Leads table

3. **Update Dashboard** (optional)
   - Consider adding an "Onboarding" view to track sign-ups separately from leads
   - Filter by Status to see conversion funnel

## Migration Notes

- Existing leads in the Leads table are unaffected
- New submissions will create records in all three tables
- Business records are created automatically (no manual step needed)
