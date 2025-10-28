# Beautiful Documents Skill - Examples

This directory contains example workflows and outputs demonstrating the skill in action.

## Example 1: Q3 2025 Lender Update

**Scenario**: Generate quarterly lender update for GAIN's debt lenders (EWB, WebBank, Triumph)

### Input
Markdown file with content sections:
- Executive summary
- Sales update (Michigan expansion, product performance)
- Finance update (EWB syndication, Triumph securitization)
- Q3 metrics tables
- Closing summary

**Source**: `/Users/saulmateos/Documents/Marketing Brain/Projects/Lender Update/Lender Updates/Working lender update/Q3_2025_LENDER_UPDATE_DRAFT.md`

### Workflow

```bash
# Step 1: Create Quarto document from template
cp templates/lender-update.qmd Q3_2025_Lender_Update.qmd

# Step 2: Populate with content (using markdown source)
# [Edit Q3_2025_Lender_Update.qmd with actual content]

# Step 3: Render to PDF
quarto render Q3_2025_Lender_Update.qmd --to typst

# Step 4: Validate output
python scripts/validate-document.py Q3_2025_Lender_Update.pdf

# Step 5: Open for review
open Q3_2025_Lender_Update.pdf
```

### Output
- **File**: `Q3_2025_Lender_Update.pdf`
- **Pages**: 14 pages
- **Size**: 143 KB
- **Compile Time**: ~2 seconds
- **Quality**: Investment-grade, zero manual fixes needed

### What Makes It Great
✓ Professional typography (Helvetica Neue, proper kerning)
✓ GAIN brand colors throughout (#003366, #00C8FF)
✓ Intelligent page breaks (no orphaned headings/signatures)
✓ Tables stay intact (no mid-table breaks)
✓ Callout boxes properly formatted with blue accents
✓ Consistent spacing and margins

## Example 2: Executive Summary Dashboard

**Scenario**: One-page KPI dashboard for board meeting

### Input
Key metrics for the period:
```json
{
  "period": "Q3 2025",
  "total_collections": 5800000,
  "collections_target": 5200000,
  "net_cash_flow": 1300000,
  "cashflow_target": 1100000,
  "total_invoices": 52891,
  "yoy_growth": 0.169,
  "key_milestone": "WebBank field examination complete - syndication advancing"
}
```

### Workflow

```bash
# Step 1: Create from template
cp templates/executive-summary.qmd Q3_2025_Executive_Summary.qmd

# Step 2: Populate with metrics
# [Edit with actual values]

# Step 3: Render (single page)
quarto render Q3_2025_Executive_Summary.qmd --to typst

# Step 4: Validate
python scripts/validate-document.py Q3_2025_Executive_Summary.pdf

# Step 5: Review
open Q3_2025_Executive_Summary.pdf
```

### Output
- **File**: `Q3_2025_Executive_Summary.pdf`
- **Pages**: 1 page
- **Size**: ~50 KB
- **Compile Time**: <1 second
- **Layout**: 2-column grid with KPI tables, callouts, priorities

### Use Case
Perfect for:
- Board meeting handouts
- Quick executive briefings
- Email attachments (small file size)
- Printing (fits on single page)

## Example 3: Financial Report

**Scenario**: Monthly P&L analysis with variance commentary

### Input
Financial data from accounting system:
- Income statement (actual vs. budget)
- Balance sheet (period-end vs. prior)
- Cash flow statement
- Key ratios and metrics

### Workflow

```bash
# Step 1: Create from template
cp templates/financial-report.qmd September_2025_Financial_Report.qmd

# Step 2: Populate tables and commentary
# [Edit with actual financial data]

# Step 3: Render multi-page report
quarto render September_2025_Financial_Report.qmd --to typst

# Step 4: Validate
python scripts/validate-document.py September_2025_Financial_Report.pdf

# Step 5: Review
open September_2025_Financial_Report.pdf
```

### Output
- **File**: `September_2025_Financial_Report.pdf`
- **Pages**: 8-12 pages (depending on content)
- **Size**: ~200 KB
- **Sections**:
  - Executive Summary
  - Income Statement Analysis
  - Balance Sheet Analysis
  - Cash Flow Analysis
  - Scenario Planning
  - Recommendations

## Example 4: Custom Document (Ad Hoc)

**Scenario**: User asks "Create a lender update for Q4"

### Conversation Flow

**User**: "Create Q4 lender update"

**Skill**:
1. Asks: "What sections should I include?"
2. User provides: Executive summary, sales update, finance update, Q4 metrics
3. Creates `Q4_2025_Lender_Update.qmd` from template
4. Populates with user content (via conversation or markdown file)
5. Renders: `quarto render Q4_2025_Lender_Update.qmd`
6. Validates: `python scripts/validate-document.py Q4_2025_Lender_Update.pdf`
7. Opens: `open Q4_2025_Lender_Update.pdf`
8. Reports: "Created 14-page lender update. PDF is open for review."

**User sees**: Professional document ready to send, zero formatting needed.

## Tips for Best Results

### Content Preparation
- **Tables**: Use markdown table syntax (Quarto converts automatically)
- **Callouts**: Use `:::` fence syntax for blue/green/yellow boxes
- **Page Breaks**: Let Quarto optimize (only use `{{< pagebreak >}}` for major sections)
- **Metrics**: Format consistently ($4.2M, 52K, +38.1%)

### Document Structure
- **Start strong**: Lead with executive summary
- **Use hierarchy**: H1 for major sections, H2 for subsections, H3 for details
- **Break it up**: Mix narrative paragraphs with tables and callouts
- **End clean**: Signature block should have context above it

### Validation Checklist
Before sending document:
- [ ] Run `python scripts/validate-document.py document.pdf`
- [ ] Open PDF and spot-check:
  - First page (title/branding)
  - Last page (signature not orphaned)
  - Tables (all intact, no breaks)
  - Callouts (blue boxes formatted correctly)
- [ ] Check file size (< 500 KB ideal)
- [ ] Verify page count (10-15 for lender updates, 1 for exec summaries)

## Advanced: Customization

### Adding New Templates

1. Create `.qmd` file in `templates/`
2. Copy YAML frontmatter from existing template
3. Adjust title, subtitle, margins as needed
4. Add section structure with placeholders
5. Test compilation: `quarto render new-template.qmd`

### Modifying GAIN Branding

Colors, fonts, spacing defined in Quarto's Typst backend.

To change colors:
```yaml
format:
  typst:
    # Add custom Typst code
    include-in-header: |
      #let gain-dark-blue = rgb("#YOUR_COLOR")
```

### Integration with Data Sources

For automated reports (e.g., monthly financials):

```python
#!/usr/bin/env python3
"""Generate monthly financial report from accounting system"""

import json
import subprocess
from jinja2 import Template

# Step 1: Fetch data from API
data = fetch_financial_data(month="2025-09")

# Step 2: Render template
template = Template(open('templates/financial-report.qmd').read())
rendered = template.render(**data)

# Step 3: Write populated document
with open('September_2025_Financial_Report.qmd', 'w') as f:
    f.write(rendered)

# Step 4: Compile
subprocess.run(['quarto', 'render', 'September_2025_Financial_Report.qmd'])

# Step 5: Validate
subprocess.run(['python', 'scripts/validate-document.py', 'September_2025_Financial_Report.pdf'])
```

## Troubleshooting

### Common Issues

**Issue**: Font warnings in output
**Fix**: Install Helvetica Neue or use system default (Quarto handles fallback)

**Issue**: Table too wide for page
**Fix**: Reduce columns or use landscape orientation:
```yaml
format:
  typst:
    papersize: us-letter
    orientation: landscape  # For wide tables
```

**Issue**: Callout boxes not colored
**Fix**: Verify `:::` fence syntax is correct (must have `{.callout-note}`)

**Issue**: Page breaks in wrong places
**Fix**: Remove any manual `{{< pagebreak >}}` and let Quarto optimize

## Support

For issues with the skill:
1. Check examples in this directory
2. Review main SKILL.md documentation
3. Test with minimal example (one section)
4. Verify Quarto/Typst installation: `quarto --version && typst --version`

---

**Last Updated**: October 25, 2025
**Skill Version**: 1.0.0
