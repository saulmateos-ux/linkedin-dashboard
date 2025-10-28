# Clay Documentation Reference

## What is Clay?

Clay is a Go-to-Market (GTM) automation platform that helps revenue teams automate prospect research, data enrichment, and outbound campaigns. Clay is built for teams that value "testing, learning, and iterating" and rewards experimentation over perfection.

## Core Features

### 1. Data Sourcing
Find companies and people through multiple sources:
- LinkedIn search and scraping
- Google Maps for local businesses
- CRM integrations (Salesforce, HubSpot)
- Apollo, ZoomInfo, and other databases
- Custom web scraping

### 2. Enrichment
Add missing data to prospect profiles using **waterfalls** (sequential data provider queries):
- Email addresses (personal and work)
- Phone numbers (direct dials, mobile)
- Job titles and seniority
- Company information (size, industry, funding)
- Social media profiles
- Technologies used

### 3. Transformation
Clean, normalize, and structure data:
- **AI Formula Generator** - Write formulas in plain English
- Data validation and cleaning
- Conditional logic (IF statements)
- Text manipulation (CONCAT, SPLIT, FIND)
- Date calculations
- Custom formatting

### 4. Automation
Build workflows for:
- **CRM Enrichment & Hygiene** - Keep contact/company data current
- **Inbound Lead Processing** - Enrich, score, and route leads automatically
- **Outbound Campaigns** - Personalized email sequences at scale
- **Signal Monitoring** - Job changes, company news, hiring activity

### 5. Integrations
Connect to 150+ providers:
- CRMs: Salesforce, HubSpot, Pipedrive
- Email: Gmail, Outlook, Instantly, SmartLead
- Data: Apollo, ZoomInfo, Clearbit, Hunter
- Enrichment: People Data Labs, Prospeo, Datagma
- Web scraping: Apify, Scraping Bee

## How Clay Works: The FETC Framework

Effective GTM automation follows this sequence:

### **F**ind → **E**nrich → **T**ransform → **C**reate

1. **Find** - Source your target prospects
2. **Enrich** - Add missing data points
3. **Transform** - Clean and structure for action
4. **Create** - Generate personalized content

## Key Concepts

### Tables
Clay's interface is spreadsheet-like:
- Each row = one prospect/company
- Columns = data fields (email, phone, company, etc.)
- Add columns by adding enrichments or formulas
- Filter, sort, and export like Excel

### Enrichments
Pre-built integrations to data providers:
- Click "Add Enrichment" → Choose provider
- Map your input columns (e.g., LinkedIn URL)
- Clay fetches data and adds to new columns
- Credits deducted per successful lookup

### Waterfalls
Sequential enrichment strategy:
- Try Provider A first (cheapest/fastest)
- If no result, try Provider B
- Continue until data found or all providers exhausted
- Maximizes data coverage, minimizes cost

Example waterfall for finding emails:
1. Check existing CRM data (free)
2. Try Hunter.io (cheap, $0.01/lookup)
3. Try Apollo.io (moderate, $0.05/lookup)
4. Try ZoomInfo (expensive, $0.50/lookup)

### AI Formula Generator
Write formulas in plain English:
- No coding required
- Use "/" to reference columns
- Generates formula automatically
- Preview output before saving

Example requests:
- "Concatenate first name and last name with a space"
- "Extract domain from email address"
- "If job title contains 'VP' or 'Director', return 'Senior', else 'Junior'"
- "Calculate days since last contact"

## Common Use Cases

### 1. CRM Enrichment & Hygiene
**Goal**: Keep contact/company data complete and current

**Workflow**:
- Import contacts from CRM
- Enrich missing fields (emails, phones, job titles)
- Validate existing data (check if emails still valid)
- Push updated data back to CRM

### 2. TAM Sourcing
**Goal**: Systematically map your total addressable market

**Workflow**:
- Define ideal customer profile (ICP)
- Use LinkedIn search to find matching companies
- Enrich with company data (size, industry, funding)
- Find decision-makers at those companies
- Export qualified list

### 3. Automated Outbound
**Goal**: Run personalized email campaigns at scale

**Workflow**:
- Build prospect list (from LinkedIn, Apollo, etc.)
- Enrich with contact data (email, phone)
- Use AI to personalize messaging (reference recent news, mutual connections)
- Push to email sequencer (Instantly, SmartLead)
- Track responses in CRM

### 4. Automated Inbound
**Goal**: Enrich, score, and route incoming leads quickly

**Workflow**:
- Trigger on new lead (form fill, demo request)
- Enrich company and contact data
- Score lead (company size, industry, budget signals)
- Route to appropriate sales rep
- Create task in CRM

### 5. Account-Based Marketing (ABM)
**Goal**: Target specific high-value accounts

**Workflow**:
- Import target account list
- Find all employees at those companies
- Filter by job title/seniority
- Enrich contact data
- Personalize outreach per account
- Coordinate multi-threaded campaigns

## Best Practices

### Credit Optimization
- **Use waterfalls** - Start with cheapest providers
- **Filter before enriching** - Don't enrich bad leads
- **Cache results** - Store enriched data to avoid re-lookups
- **Validate inputs** - Bad inputs = wasted credits

### Table Design
- **One row per entity** - Don't mix companies and people in same table
- **Use linked tables** - Connect companies → people for better organization
- **Name columns clearly** - "Apollo Email" vs "Hunter Email" for clarity
- **Add notes** - Document your logic for future you

### Formula Tips
- **Use AI generator** - Don't write formulas manually
- **Test on sample** - Preview output before running on full table
- **Reference columns** - Use /column_name instead of hardcoding
- **Add error handling** - Use IF statements to handle missing data

### Workflow Automation
- **Start simple** - Build one workflow, test, then expand
- **Use conditional runs** - Only run enrichments when needed
- **Monitor credit usage** - Check daily spend in settings
- **Document your workflow** - Add notes for teammates

## Common Formulas

### Concatenation
**Goal**: Combine multiple fields

**Example**: `{{first_name}} {{last_name}}`

**AI Prompt**: "Concatenate first name and last name with a space"

### Conditional Logic
**Goal**: Different outputs based on conditions

**Example**: Senior vs Junior classification

**AI Prompt**: "If job title contains 'VP', 'Director', or 'Head', return 'Senior', else return 'Junior'"

### Text Extraction
**Goal**: Extract part of a text field

**Example**: Get domain from email

**AI Prompt**: "Extract the domain from the email address (everything after @)"

### Data Validation
**Goal**: Check if data meets criteria

**Example**: Valid email format

**AI Prompt**: "Check if email contains @ symbol and a domain extension (.com, .org, etc). Return 'Valid' or 'Invalid'"

### Date Calculations
**Goal**: Calculate time differences

**Example**: Days since last contact

**AI Prompt**: "Calculate the number of days between last contact date and today"

## Getting Help

### In-App Resources
- **Clay University** - Free courses and tutorials
- **Templates** - Pre-built workflows for common use cases
- **Community** - Ask questions in Clay Slack community

### Documentation
- **Support Docs**: support.clay.com
- **Blog**: clay.com/blog (workflow guides and best practices)
- **YouTube**: Video tutorials and walkthroughs

### Support Channels
- **In-app chat** - Click help icon in bottom right
- **Slack community** - community.clay.com
- **Email support** - support@clay.com
