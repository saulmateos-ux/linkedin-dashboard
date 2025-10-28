# Beautiful Documents - Quick Start

**30-second workflow**: Markdown → Professional PDF

## One Command

```bash
quarto render document.qmd --to typst && open document.pdf
```

## Three Templates

### 1. Lender Update (10-15 pages)
```bash
cp templates/lender-update.qmd My_Update.qmd
# Edit content
quarto render My_Update.qmd --to typst
```

### 2. Executive Summary (1 page)
```bash
cp templates/executive-summary.qmd My_Summary.qmd
# Edit content
quarto render My_Summary.qmd --to typst
```

### 3. Financial Report (8-12 pages)
```bash
cp templates/financial-report.qmd My_Report.qmd
# Edit content
quarto render My_Report.qmd --to typst
```

## Markdown Syntax

### Callout Boxes
```markdown
::: {.callout-note}
## Title
Content here
:::
```

Types: `note` (blue), `tip` (green), `warning` (yellow), `important` (red)

### Tables
```markdown
| Col 1 | Col 2 | Col 3 |
|-------|-------|-------|
| Data  | Data  | Data  |

: Table Caption {#tbl-id}
```

### Page Breaks
```markdown
{{< pagebreak >}}
```

Use sparingly - Quarto optimizes automatically.

## GAIN Brand Colors

- **Dark Blue**: #003366 (headings, accents)
- **Light Blue**: #00C8FF (highlights, lines)
- **Gray**: #4D4C5B (body text)

Applied automatically via templates.

## Validation

```bash
python3 scripts/validate-document.py document.pdf
```

Should see:
```
✓ File Exists
✓ Page Count
✓ File Size
✓ Branding
ALL CHECKS PASSED ✓
```

## Common Issues

| Issue | Fix |
|-------|-----|
| Font warnings | Ignore (non-critical, uses fallback) |
| Callouts not colored | Check syntax: `{.callout-note}` |
| Table too wide | Reduce columns or use landscape mode |
| Wrong page breaks | Remove manual breaks, let Quarto optimize |

## Installation

```bash
# Install tools (one time)
brew install quarto typst

# Verify
quarto --version  # Should be v1.6+
typst --version   # Should be v0.14+
```

## File Locations

```
.claude/skills/beautiful-documents/
├── SKILL.md              # Complete documentation
├── README.md             # Overview
├── QUICKSTART.md         # This file
├── templates/            # Document templates
├── scripts/              # Validation scripts
└── examples/             # Usage examples
```

## Example Output

**Test sample**:
```bash
quarto render test-sample.qmd --to typst
```

**Result**: 6-page lender update, 84 KB, professional quality, zero manual fixes.

## What Makes It Great

- Automatic page break optimization (no orphaned content)
- Professional typography (Helvetica Neue, proper kerning)
- GAIN brand colors throughout
- Tables stay intact (no mid-table breaks)
- Callout boxes properly formatted
- Fast compilation (~2 seconds for 15 pages)
- Small file sizes (~100 KB typical)

## Getting Help

1. Check `SKILL.md` for complete documentation
2. Review `examples/README.md` for usage patterns
3. Test with `test-sample.qmd` to verify setup
4. Ask Claude: "How do I create a lender update?"

---

**Version**: 1.0.0 | **Created**: October 25, 2025 | **Author**: Saul Mateos
