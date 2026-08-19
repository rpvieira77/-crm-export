# CRM Export Dashboard

Automated CRM lead export with real-time dashboard visualization.

## Features

### Backend (Python)
- **Automated Export**: Playwright-based browser automation to extract leads from CRM
- **Flexible Scheduling**: Cron-based or manual execution
- **Secure Credentials**: Support for environment variables and Supabase Vault
- **Error Handling**: Comprehensive logging and error recovery

### Frontend (React)
- **Real-time Dashboard**: Live lead statistics and trends
- **Visual Analytics**: 30-minute interval frequency charts
- **Lead Table**: Recent leads with full details
- **Auto-refresh**: Automatic updates every 60 seconds
- **Responsive Design**: Works on desktop, tablet, and mobile

### Security
- Encrypted credential storage (Supabase Vault)
- HTTPS-only communication
- Data retention policies
- GDPR/CCPA compliant
- Comprehensive audit logging

## Quick Start

### Backend Setup (5 minutes)

```bash
cd crm-export
pip install -r requirements.txt
playwright install chromium

cp .env.example .env
# Edit .env with your CRM credentials

python export.py
```

See [crm-export/docs/SETUP_SIMPLE.md](crm-export/docs/SETUP_SIMPLE.md) for detailed setup.

### Frontend Setup

```bash
npm install
npm run dev
# Visit http://localhost:3000/leads
```

## Project Structure

```
.
├── crm-export/                    # Python export automation
│   ├── export.py                  # Main export script
│   ├── requirements.txt
│   ├── .env.example
│   └── docs/
│       ├── SETUP_SIMPLE.md        # 5-minute quick start
│       ├── SETUP_SUPABASE_SECRETS.md  # Secure credential storage
│       └── SECURITY_GUIDE.md      # Security best practices
├── src/
│   ├── components/
│   │   └── LeadsDashboard.tsx     # Dashboard component
│   └── pages/
│       └── leads.tsx              # Leads page
└── README.md
```

## Configuration

### Environment Variables

```bash
# CRM Connection (required)
CRM_URL=https://your-crm.com
CRM_USERNAME=your_username
CRM_PASSWORD=your_password

# Export Settings (optional)
OUTPUT_DIR=./exports
HEADLESS=true

# Supabase (optional, for secure credential storage)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-key
```

## Automation

### Cron Job (Linux/macOS)

Run export every 30 minutes:

```bash
*/30 * * * * cd /path/to/crm-export && python export.py >> logs/export.log 2>&1
```

### GitHub Actions

Create `.github/workflows/export.yml`:

```yaml
name: CRM Export

on:
  schedule:
    - cron: '*/30 * * * *'  # Every 30 minutes

jobs:
  export:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      - run: |
          pip install -r crm-export/requirements.txt
          playwright install chromium
          python crm-export/export.py
        env:
          CRM_URL: ${{ secrets.CRM_URL }}
          CRM_USERNAME: ${{ secrets.CRM_USERNAME }}
          CRM_PASSWORD: ${{ secrets.CRM_PASSWORD }}
```

## Dashboard Features

### Statistics Cards
- **Total Leads**: Cumulative count of all leads
- **Leads Today**: New leads added in the current day
- **Avg/Hour**: Average leads per hour today
- **Recommended Team**: Suggested team size based on lead volume

### Frequency Chart
Visual representation of leads by 30-minute intervals over the last 24 hours.

### Recent Leads Table
- ID, Name, Phone, Status, Created timestamp
- Sortable columns
- Status badges (active, pending, inactive)

## Security

For production deployments, follow the [Security Guide](crm-export/docs/SECURITY_GUIDE.md):

- ✅ Store credentials in Supabase Vault
- ✅ Restrict file permissions (600 for CSVs)
- ✅ Enable audit logging
- ✅ Rotate credentials every 90 days
- ✅ Use HTTPS for all communications
- ✅ Implement data retention policies

## Data Source

Dashboard loads lead data from:
```
https://srv1519953.hstgr.cloud/crm_exports/leads.csv
```

## License

Private repository.

## Support

For issues or questions:
1. Check [SETUP_SIMPLE.md](crm-export/docs/SETUP_SIMPLE.md) for setup issues
2. Review [SECURITY_GUIDE.md](crm-export/docs/SECURITY_GUIDE.md) for security concerns
3. Check logs in `crm-export/logs/` directory
