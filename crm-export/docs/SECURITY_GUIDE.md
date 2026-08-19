# CRM Export Security Guide

## Overview

This guide outlines security best practices for the CRM export automation system.

## 1. Credential Management

### ✅ DO

- Store credentials in environment variables or Supabase Vault
- Use service accounts with minimal required permissions
- Rotate credentials regularly (every 90 days)
- Use separate credentials for development and production

### ❌ DON'T

- Commit `.env` files to version control
- Use personal login credentials
- Share credentials via email or Slack
- Store passwords in plaintext logs

### Implementation

```bash
# Good: Use environment variables
export CRM_USERNAME=$(aws secretsmanager get-secret-value --secret-id crm-username)

# Or use Supabase Vault (see SETUP_SUPABASE_SECRETS.md)
supabase secrets set CRM_PASSWORD "..."
```

## 2. Network Security

### HTTPS Only

Ensure `CRM_URL` always uses `https://`:

```python
if not self.crm_url.startswith('https://'):
    raise ValueError("CRM_URL must use HTTPS")
```

### SSL Certificate Validation

```python
# Playwright automatically validates SSL certificates
# To disable (NOT RECOMMENDED):
page = browser.new_page(
    ignore_https_errors=False  # Always True (default)
)
```

## 3. Data Protection

### Export Files

- Store exports in a dedicated, restricted directory
- Use file-level encryption for sensitive data
- Implement automatic cleanup of old exports (>30 days)

```python
import shutil
from datetime import datetime, timedelta

def cleanup_old_exports(days=30):
    cutoff = datetime.now() - timedelta(days=days)
    for file in Path(self.output_dir).glob('leads_*.csv'):
        if datetime.fromtimestamp(file.stat().st_mtime) < cutoff:
            file.unlink()
            logger.info(f"Deleted old export: {file}")
```

### CSV Permissions

```bash
# Restrict file access (production only)
chmod 600 exports/leads_*.csv
chown export-user:export-group exports/leads_*.csv
```

## 4. Logging & Monitoring

### Log Files

- Never log passwords or sensitive data
- Log all export attempts (success/failure)
- Store logs separately from exported data

```python
logger = logging.getLogger(__name__)

# Good
logger.info(f"Exported {len(leads)} leads")

# Bad
logger.info(f"Logged in as {self.crm_username}:{self.crm_password}")
```

### Error Handling

```python
except Exception as e:
    # Don't expose internal details
    logger.error(f"Export failed: {str(e)}")
    # Instead of:
    logger.error(f"Connection failed at {self.crm_url}: {e}")
```

## 5. Access Control

### User Permissions

- Use separate service accounts
- Grant read-only access to CRM
- Audit all account activities

### Export Directory

```bash
# Set proper ownership and permissions
sudo chown -R export-user:export-group /path/to/exports
chmod 750 /path/to/exports  # No world-readable
chmod 640 /path/to/exports/*.csv  # Owner/group only
```

## 6. Network Isolation

### Firewall Rules (AWS/GCP)

```bash
# Allow outbound HTTPS to CRM only
# Deny all other outbound traffic
# Deny inbound traffic
```

### VPN/Proxy

For production deployments, route through:
- AWS PrivateLink / VPN
- Corporate VPN
- HTTP Proxy with authentication

## 7. Compliance

### GDPR/CCPA

- Obtain explicit consent before exporting personal data
- Implement data retention policies
- Provide data deletion on request

```python
def delete_export_by_id(export_id):
    """Securely delete a specific export file"""
    file_path = Path(self.output_dir) / f"leads_{export_id}.csv"
    if file_path.exists():
        file_path.unlink()
        logger.info(f"Deleted export: {export_id}")
```

### Data Classification

- Leads data = PII (Personally Identifiable Information)
- Handle as confidential
- Restrict access to authorized personnel only

## 8. Deployment Security

### GitHub/GitLab

```bash
# .gitignore
.env
.env.local
.env.*.local
exports/
logs/
*.csv
```

### Docker Security

```dockerfile
# Dockerfile
FROM python:3.11-slim

# Don't run as root
USER export-user

# Copy requirements only first
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY export.py .

# Use secrets for runtime
CMD ["python", "export.py"]
```

Run with secrets:
```bash
docker run \
  --secret crm_password \
  --secret crm_username \
  export-leads:latest
```

## 9. Incident Response

### What to do if credentials are exposed

1. **Immediately** change the exposed credential
2. Revoke any active sessions
3. Review audit logs for unauthorized access
4. Notify security team
5. Update documentation

## 10. Regular Security Practices

- [ ] Review access logs monthly
- [ ] Rotate credentials every 90 days
- [ ] Update dependencies weekly
- [ ] Test disaster recovery quarterly
- [ ] Conduct security audit annually

## Checklist

- [ ] All credentials in environment or Supabase Vault
- [ ] CRM_URL uses HTTPS
- [ ] .env files in .gitignore
- [ ] Proper file permissions (600 for CSVs)
- [ ] No sensitive data in logs
- [ ] Export cleanup scheduled
- [ ] Access logging enabled
- [ ] Team trained on security practices
- [ ] Incident response plan documented
- [ ] Compliance requirements met

## Support

For security concerns:
1. Create a private security advisory
2. Don't discuss in public issues
3. Email security team directly
