---
name: beautiful-documents
description: Generate investment-grade GAIN-branded documents (lender updates, board decks, financial reports) using Quarto + Typst with automatic page break optimization and professional typography.
author: Saul Mateos
version: 1.0.0
created: 2025-10-25
tags: [documents, typst, quarto, financial-reporting, branding, gain]
---

# Beautiful Documents Skill

Generate sophisticated, professionally formatted documents for GAIN with zero manual formatting fixes.

## What This Skill Does

Creates investment-bank quality documents using:
- **Quarto + Typst workflow** for automatic page break optimization
- **GAIN brand system** (colors, fonts, templates)
- **Professional typography** superior to Word/Google Docs
- **Intelligent layout** with widow/orphan control, smart table breaks

## When to Use This Skill

Invoke automatically when user asks to:
- "Create a lender update"
- "Generate board deck"
- "Make financial report"
- "Create executive summary"
- "Draft investor update"
- "Generate quarterly report"
- "Create covenant compliance report"

## Document Types Supported

### 1. Lender Updates
**Template**: `lender-update.qmd`
**Use For**: Quarterly updates to debt lenders (EWB, WebBank, etc.)
**Includes**: Executive summary, sales update, finance update, metrics tables, callout boxes

### 2. Executive Summaries
**Template**: `executive-summary.qmd`
**Use For**: One-page dashboards for board meetings
**Includes**: KPI grid, YoY comparisons, key highlights

### 3. Board Decks
**Template**: `board-deck.qmd`
**Use For**: Monthly/quarterly board presentations
**Includes**: Title slides, financial metrics, strategic updates

### 4. Financial Reports
**Template**: `financial-report.qmd`
**Use For**: P&L analysis, cash flow reports, covenant compliance
**Includes**: Three-statement analysis, variance commentary, scenario planning

## GAIN Brand System

### Colors
```yaml
gain-dark-blue: "#003366"    # Primary brand color (headings, accents)
gain-light-blue: "#00C8FF"   # Secondary brand color (highlights, lines)
gain-gray: "#4D4C5B"         # Body text, subheadings
gain-light-gray: "#F5F5F5"   # Backgrounds, callout boxes
```

### Typography
- **Primary Font**: Helvetica Neue (11pt body, 20pt H1, 16pt H2, 13pt H3)
- **Monospace**: SF Mono (for code/data), fallback to Menlo
- **Emphasis**: Bold for key metrics, italics sparingly

### Layout Standards
- **Paper**: US Letter (8.5" × 11")
- **Margins**: 1.5" top, 1" bottom, 1" left/right
- **Spacing**: 1.2em paragraph spacing, 0.65em leading
- **Justification**: Full justify for body text

## Workflow

### Step 1: Gather Content
Ask user for:
- **Document type** (lender update, board deck, etc.)
- **Time period** (Q3 2025, October 2025, etc.)
- **Key sections** (executive summary, sales, finance, metrics)
- **Data/metrics** (tables, charts, proof points)
- **Markdown source** (if available) or dictate content

### Step 2: Create Quarto Document
Use appropriate template from `templates/` directory:

```markdown
---
title: "GAIN Lender Update"
subtitle: "Q3 2025 | July - September 2025"
author: "Reid M. Zeising, CEO & Founder"
date: "October 25, 2025"
format:
  typst:
    papersize: us-letter
    mainfont: "Helvetica Neue"
    fontsize: 11pt
    margin:
      x: 1in
      y: 1.5in
    keep-tex: false
    toc: false
    section-numbering: "1.1"
---

Dear Lenders,

# Executive Summary

Q3 2025 marked significant progress...

::: {.callout-note}
## Key Milestone
Important callout with blue branding
:::

{{< pagebreak >}}

# Sales Update

[Content continues...]
```

### Step 3: Compile to PDF
```bash
quarto render document.qmd --to typst
```

Quarto automatically:
- Optimizes page breaks (no orphaned headings/signatures)
- Prevents widow/orphan lines
- Keeps tables together
- Balances page bottoms
- Applies GAIN branding

### Step 4: Validate Output
Run validation script:
```bash
python scripts/validate-document.py document.pdf
```

Checks for:
- Page count (warn if > 20 pages for lender updates)
- Orphaned signatures (flag if "Sincerely," alone on page)
- Empty pages (flag if > 70% white space)
- Table breaks (warn if tables split across pages)
- Font consistency (verify Helvetica Neue used)

### Step 5: Open PDF
```bash
open document.pdf
```

User reviews final output (should require zero manual fixes).

## Callout Boxes

Quarto callouts automatically styled with GAIN colors:

```markdown
::: {.callout-note}
## Blue Info Box
For key milestones, important dates, strategic highlights
:::

::: {.callout-tip}
## Green Success Box
For positive metrics, achievements, wins
:::

::: {.callout-warning}
## Yellow Caution Box
For risks, challenges, items requiring attention
:::

::: {.callout-important}
## Red Critical Box
For urgent items, covenant issues, material changes
:::
```

## Tables

Financial tables use Quarto's grid syntax:

```markdown
| Metric | Q3 2024 | Q3 2025 | YoY Growth |
|--------|---------|---------|------------|
| Total Invoices | 45,234 | 52,891 | +16.9% |
| Collections | $4.2M | $5.8M | +38.1% |
| Net Cash Flow | $892K | $1.3M | +45.7% |

: Q3 2025 Operating Metrics {#tbl-q3-metrics}
```

Tables automatically:
- Stay together (no mid-table breaks)
- Use GAIN colors for headers
- Format currency properly
- Align numbers right

## Page Break Control

**Let Quarto handle breaks automatically.** Only use manual breaks for:

### Forced Page Break
```markdown
{{< pagebreak >}}
```

Use after major sections (Executive Summary → Sales Update).

### Keep Section Together
```markdown
::: {.content-block}
## Section That Must Stay Together

Multiple paragraphs...

| Table data |
|------------|
| Row 1      |
:::
```

### Signature Protection
Quarto automatically prevents orphaned signatures. If override needed:

```markdown
::: {.content-block}
We appreciate your continued support.

Sincerely,

**Reid M. Zeising**
CEO & Founder
GAIN
:::
```

## Examples

### Example 1: Q3 2025 Lender Update
**Input**: `/Users/saulmateos/Documents/Marketing Brain/Projects/Lender Update/Lender Updates/Working lender update/Q3_2025_LENDER_UPDATE_DRAFT.md`

**Output**: 14-page PDF with:
- Title page (GAIN branding)
- Executive summary with blue callout
- Sales update (Michigan, Midwest expansion)
- Finance update (EWB syndication, Triumph securitization)
- Q3 metrics tables
- Professional signature

**Compile Time**: ~2 seconds
**Quality**: Investment-grade, zero manual fixes

### Example 2: Executive Summary Dashboard
**Input**: JSON from financial system
```json
{
  "period": "Q3 2025",
  "collections": 5800000,
  "yoy_growth": 0.381,
  "net_cash_flow": 1300000,
  "key_milestone": "WebBank field examination complete"
}
```

**Output**: 1-page KPI dashboard with:
- GAIN header/footer
- Metric grid (2×2 layout)
- YoY comparison charts
- Key milestone callout

**Compile Time**: ~1 second

### Example 3: Board Deck (20 slides)
**Input**: Markdown outline + tables
**Output**: Professional slide deck with:
- Title slide (GAIN branding)
- Agenda slide
- Financial slides (P&L, BS, CF)
- Strategic update slides
- Appendix with detailed tables

**Compile Time**: ~3 seconds

## Validation Script

`scripts/validate-document.py` checks output quality:

```python
#!/usr/bin/env python3
"""
Validate GAIN document output quality
Checks: page breaks, orphans, table splits, branding
"""

import PyPDF2
import sys

def validate_document(pdf_path):
    checks = {
        'page_count': check_page_count(pdf_path),
        'orphaned_signature': check_signature(pdf_path),
        'empty_pages': check_whitespace(pdf_path),
        'table_breaks': check_tables(pdf_path),
        'font_consistency': check_fonts(pdf_path)
    }

    # Report results
    for check, result in checks.items():
        status = "✓" if result['passed'] else "✗"
        print(f"{status} {check}: {result['message']}")

    return all(c['passed'] for c in checks.values())

if __name__ == '__main__':
    pdf_path = sys.argv[1]
    passed = validate_document(pdf_path)
    sys.exit(0 if passed else 1)
```

Run after compilation:
```bash
quarto render document.qmd && python scripts/validate-document.py document.pdf
```

## Troubleshooting

### Issue: Font warnings "unknown font family: SF Mono"
**Fix**: Use fallback (Menlo). Non-critical, doesn't affect output.

### Issue: Quarto YAML error "must be a string"
**Fix**: Change `section-numbering: false` to `section-numbering: "1.1"`

### Issue: Tables breaking across pages
**Fix**: Quarto should prevent this automatically. If occurs, wrap in `{.content-block}`:
```markdown
::: {.content-block}
| Table |
|-------|
| Data  |
:::
```

### Issue: Orphaned signature
**Fix**: Quarto's widow/orphan control should prevent. If occurs, add content before signature or use `{.content-block}`.

### Issue: Too much white space on page
**Fix**: Remove any manual `pagebreak(weak: true)` if converting from raw Typst. Let Quarto optimize.

## Quality Standards

Documents must meet:
- **Typography**: Professional kerning, ligatures, hyphenation
- **Branding**: GAIN colors (#003366, #00C8FF) throughout
- **Layout**: No orphaned headings, signatures, or callouts
- **Tables**: Intact, no mid-table breaks
- **Page Count**: Appropriate for document type (lender updates: 10-15 pages, exec summary: 1 page)
- **File Size**: Optimized (< 500 KB for 15-page document)
- **Accessibility**: Proper heading hierarchy, alt text for images

## User Experience

**User asks**: "Create Q4 lender update"

**Skill responds**:
1. "I'll create a GAIN-branded lender update for Q4 2025. What sections do you want to include?"
2. User provides: Executive summary, sales update, finance update, metrics
3. Create `Q4_2025_Lender_Update.qmd` using lender-update template
4. Populate with user content
5. Compile: `quarto render Q4_2025_Lender_Update.qmd`
6. Validate: `python scripts/validate-document.py Q4_2025_Lender_Update.pdf`
7. Open: `open Q4_2025_Lender_Update.pdf`
8. Confirm: "Created 14-page lender update with zero manual formatting needed. PDF is open."

**User sees**: Investment-grade document, ready to send to lenders.

## Templates Reference

All templates in `/Users/saulmateos/Documents/Marketing Brain/Typst_Templates/`:

- `lender-update.qmd` - Quarterly lender updates
- `executive-summary.qmd` - One-page KPI dashboards
- `board-deck.qmd` - Monthly board presentations
- `financial-report.qmd` - P&L, BS, CF analysis
- `gain-branding.typ` - Core brand system (imported automatically)

## Installation Requirements

```bash
# Install Quarto
brew install quarto

# Install Typst
brew install typst

# Verify installation
quarto --version  # Should be v1.6+
typst --version   # Should be v0.14+

# Install Python dependencies (for validation)
pip install PyPDF2
```

## Key Differences from Manual Typst

| Feature | Raw Typst | Quarto + Typst |
|---------|-----------|----------------|
| Page breaks | Manual `pagebreak()` | Automatic optimization |
| Widow/orphan control | Manual `breakable: false` | Built-in |
| Table breaks | Manual block wrapping | Automatic |
| Signatures | Can orphan | Protected |
| Callouts | Custom code | Simple markdown |
| Tables | Grid syntax | Markdown tables |
| Setup time | 10+ minutes | 30 seconds |

**Bottom line**: Quarto eliminates manual formatting while maintaining professional quality.

## Success Metrics

Skill succeeds when:
- ✓ Document compiles without errors
- ✓ PDF opens automatically
- ✓ Zero manual formatting fixes needed
- ✓ User says "looks great" or similar
- ✓ Validation script passes all checks
- ✓ Compile time < 5 seconds
- ✓ Output matches GAIN brand standards

## Future Enhancements

Potential additions:
- **Covenant compliance template** (lender reporting)
- **M&A teaser template** (acquisition opportunities)
- **Budget presentation template** (annual planning)
- **AR aging report template** (collections analysis)
- **Integration with GAIN financial systems** (auto-populate from APIs)
- **Multi-format export** (PDF + Word + HTML from single source)

## Related Skills

- **financial-analysis** - Analyzes P&L, BS, CF for insights
- **negotiation** - Uses Never Split the Difference framework
- **email-drafting** - Writes professional emails in Saul's voice

## Notes

- This skill embodies Saul's "I don't want to fix stupid things myself" principle
- Quality bar: Investment bank presentations (Goldman Sachs, Morgan Stanley level)
- User should NEVER need to manually adjust page breaks, spacing, or formatting
- If user reports formatting issues, update templates (not manual fixes)
- Quarto + Typst workflow is the final solution (not raw Typst)

---

**Created**: October 25, 2025
**Last Updated**: October 25, 2025
**Version**: 1.0.0
**Author**: Saul Mateos, CFO @ GAIN
