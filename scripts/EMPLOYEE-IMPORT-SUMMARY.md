# Competitor Employee Import - Complete Summary

**Date**: October 25, 2025
**Feature**: Employee-Company Relationship System

## ✅ What Was Built

### 1. Database Schema Enhancement

**Migration**: `migrations/005_add_company_relationships.sql`

- Added `company_id` column to `profiles` table (self-referencing foreign key)
- Created index for faster company lookups
- Enables linking employee profiles to company profiles

```sql
ALTER TABLE profiles ADD COLUMN company_id INTEGER REFERENCES profiles(id);
CREATE INDEX idx_profiles_company_id ON profiles(company_id);
```

### 2. TypeScript/API Updates

**Updated Files**:
- `lib/db.ts` - Profile interface + addProfile function
- `app/api/profiles/route.ts` - POST endpoint accepts `companyId`

**Changes**:
- Profile interface now includes `company_id` and `company_name` fields
- `getProfiles()` and `getWorkspaceProfiles()` join with company data
- Can create employees linked to companies via API

### 3. Import Script

**File**: `scripts/import-competitor-employees.js`

**Features**:
- Parses Apollo CSV export
- Filters for senior roles (C-suite, VPs, Founders, Partners, Owners)
- Maps employees to existing company profiles
- Auto-adds to Gain Company workspace
- Intelligent company name matching (handles various formats)

**Criteria Used**:
- Seniority levels: C suite, VP, Founder, Partner, Owner
- Must have LinkedIn profile URL
- Company must exist in database

### 4. UI Enhancements

**Updated Files**:
- `app/profiles/page.tsx` - Added "Competitor Employees" tab
- `components/ProfileCard.tsx` - Shows company name for employees

**New Tab**: "Competitor Employees (84)"
- Filters to show only competitor employees (has company_id, not a company)
- "Competitors" tab now shows only companies (is_company = true)
- Employee cards display company affiliation with 🏢 icon

## 📊 Import Results

### Total Imported
- **84 employees** from **18 companies**
- All successfully linked to their respective companies
- All added to "Gain Company" workspace

### Employees by Company

| Company | Employees |
|---------|-----------|
| Libra Solutions | 28 |
| Golden Pear Funding | 11 |
| cartiga° | 8 |
| USClaims | 7 |
| High Rise Financial LLC | 7 |
| Baker Street Funding | 3 |
| MoveDocs | 3 |
| PROVE | 3 |
| Pravati Capital LLC | 2 |
| Echelon Financial | 2 |
| Surgical Capital Solutions | 2 |
| Apogee Capital Partners LLC | 2 |
| FCA Legal Funding | 1 |
| Mustang Creek | 1 |
| Elite Medical Receivables | 1 |
| ML Healthcare | 1 |
| Liberty Legal Funding | 1 |
| Medport | 1 |

### Sample Employees Imported

**C-Suite Executives**:
- Gary Amos - CEO @ Golden Pear Funding
- Mark Berookim - CEO @ High Rise Financial
- David Lipscomb - Founder & CEO @ Libra Solutions
- Alexander Chucri - CEO @ Pravati Capital
- Robert Rigal - CEO & Founder @ Echelon Financial

**VPs and Senior Leadership**:
- 40+ Vice Presidents across all companies
- Chief Financial Officers, CTOs, COOs
- Senior Vice Presidents of various departments

## 🎯 Database Structure

### Relationships

```
┌─────────────────────┐
│  Company Profiles   │
│  (is_company=true)  │
└──────────┬──────────┘
           │
           │ company_id (FK)
           │
           ▼
┌─────────────────────┐
│ Employee Profiles   │
│ (is_company=false)  │
│ (company_id IS NOT  │
│  NULL)              │
└─────────────────────┘
```

### Query Examples

**Get all employees for a company**:
```sql
SELECT * FROM profiles
WHERE company_id = (SELECT id FROM profiles WHERE display_name LIKE '%Golden Pear%')
```

**Get company for an employee**:
```sql
SELECT
  e.display_name as employee,
  c.display_name as company
FROM profiles e
JOIN profiles c ON e.company_id = c.id
WHERE e.id = 123
```

**Count employees per company**:
```sql
SELECT
  c.display_name as company,
  COUNT(e.id) as employee_count
FROM profiles c
LEFT JOIN profiles e ON e.company_id = c.id
WHERE c.is_company = true
GROUP BY c.id, c.display_name
ORDER BY employee_count DESC
```

## 🖥️ UI Features

### New Tab: "Competitor Employees"

**Location**: `/profiles?workspace=3&type=competitor-employees`

**Features**:
- Shows 84 competitor employees
- Each card displays company affiliation
- Filtered to exclude company pages (only people)
- Grouped with other profile type tabs

### Profile Cards

**For Employees**:
- Display name (e.g., "Gary Amos")
- Username (e.g., "@gary-amos")
- **Company**: Shows "🏢 Golden Pear Funding (Company)"
- Profile type badge: "⚔️ COMPETITOR"

**For Companies**:
- Display name (e.g., "Golden Pear Funding (Company)")
- Company icon: "🏢" badge
- Profile type badge: "⚔️ COMPETITOR"

## 📈 Next Steps / Use Cases

### Analysis Opportunities

1. **Employee Advocacy Analysis**
   - Compare employee posting frequency vs company posts
   - Identify which companies leverage employee advocacy

2. **Thought Leadership Tracking**
   - Track individual executives' content themes
   - Compare Gain executives vs competitor executives

3. **Competitive Intelligence**
   - Monitor leadership changes (new hires, departures)
   - Track company announcements through employee posts

4. **Content Strategy**
   - Analyze what competitor employees post about
   - Identify trending topics in the industry

### Future Enhancements

1. **Employee Scraping**
   - Add scraping support for individual employees
   - Track employee engagement metrics

2. **Company-Employee Dashboard**
   - Aggregate view: company stats + employee stats
   - Show employee leaderboard per company

3. **Smart Filtering**
   - Filter employees by role (CEO, VP, etc.)
   - Filter employees by department
   - Filter by posting frequency

4. **AI Queries**
   - "Which competitor has most active employees?"
   - "What are Libra Solutions employees posting about?"
   - "Compare Gain vs competitor employee engagement"

## 🔧 Technical Details

### Files Changed

```
migrations/005_add_company_relationships.sql  (NEW)
lib/db.ts                                     (MODIFIED)
app/api/profiles/route.ts                     (MODIFIED)
app/profiles/page.tsx                         (MODIFIED)
components/ProfileCard.tsx                    (MODIFIED)
scripts/import-competitor-employees.js        (NEW)
```

### Database Changes

```sql
-- Before
profiles: id, username, profile_url, display_name, is_company, profile_type, ...

-- After
profiles: id, username, profile_url, display_name, is_company, profile_type, company_id, ...
            ↑ Self-referencing FK to profiles(id)
```

### API Changes

**POST /api/profiles** - New parameter:
```json
{
  "profileUrl": "https://linkedin.com/in/gary-amos",
  "displayName": "Gary Amos",
  "profileType": "competitor",
  "companyId": 22,  // NEW: Link to company profile
  "workspaceId": 3
}
```

## ✨ Summary

Successfully implemented a complete employee-company relationship system:

✅ Database schema with self-referencing foreign keys
✅ API support for linking employees to companies
✅ Automated import of 84 competitor employees
✅ UI tab for viewing competitor employees separately
✅ Company affiliation displayed on employee cards
✅ All employees organized in Gain Company workspace

**Total Profiles in Gain Workspace**:
- 19 competitor companies
- 84 competitor employees
- 5 other profiles (Gain, team, inspiration)
- **Total: 108 profiles**

---

**View it in action**: http://localhost:3000/profiles?workspace=3&type=competitor-employees
