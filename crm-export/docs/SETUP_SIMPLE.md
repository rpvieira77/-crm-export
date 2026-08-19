# Quick Start: CRM Export Setup (5 minutes)

## Prerequisites
- Python 3.8+
- pip
- Your CRM credentials

## Installation

1. **Clone the repository**
   ```bash
   git clone <repo-url>
   cd crm-export
   ```

2. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   playwright install chromium
   ```

3. **Configure credentials**
   ```bash
   cp .env.example .env
   # Edit .env with your CRM details:
   # - CRM_URL: Your CRM login URL
   # - CRM_USERNAME: Your login username
   # - CRM_PASSWORD: Your login password
   ```

4. **Test the export**
   ```bash
   python export.py
   ```

## Automating with Cron (macOS/Linux)

**Create a cron job to run every 30 minutes:**

```bash
crontab -e
```

Add this line:
```
*/30 * * * * cd /path/to/crm-export && python export.py >> logs/export.log 2>&1
```

**Create logs directory:**
```bash
mkdir -p logs
```

## Verify Setup

Check the exports directory for generated CSV files:
```bash
ls -lh exports/
```

Each export file contains:
- Lead ID
- Name
- Phone
- Status
- Created Date

## Troubleshooting

**Playwright issues:**
```bash
playwright install chromium
```

**Permission denied on cron:**
- Ensure script has execute permissions: `chmod +x export.py`
- Check full paths in cron job

**Timeout errors:**
- Increase `wait_until='networkidle'` timeout in export.py
- Check CRM server responsiveness

## Next Steps

1. Set up Supabase integration (see `SETUP_SUPABASE_SECRETS.md`)
2. Deploy dashboard (see `../src/pages/leads.tsx`)
3. Review security best practices (see `SECURITY_GUIDE.md`)
