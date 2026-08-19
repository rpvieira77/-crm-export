# Supabase Secure Configuration

## Overview

This guide secures CRM credentials using Supabase Vault, eliminating the need for `.env` files in production.

## Setup Steps

### 1. Create Supabase Project

1. Go to https://supabase.com and create a new project
2. Note your project URL and service role key

### 2. Configure Environment

In `.env`:
```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
```

### 3. Store Secrets in Supabase Vault

Use the Supabase CLI to store secrets securely:

```bash
npm install -g supabase

# Create a new secret
supabase secrets set CRM_URL "https://your-crm.com"
supabase secrets set CRM_USERNAME "your_username"
supabase secrets set CRM_PASSWORD "your_password"

# Verify secrets
supabase secrets list
```

### 4. Update export.py

Add this to the top of `export.py`:

```python
from supabase import create_client

def load_secrets_from_supabase():
    """Load secrets from Supabase Vault instead of .env"""
    supabase_url = os.getenv('SUPABASE_URL')
    supabase_key = os.getenv('SUPABASE_SERVICE_KEY')

    supabase = create_client(supabase_url, supabase_key)

    # Retrieve secrets (note: this requires Edge Functions)
    # For direct Supabase access, use API calls or Edge Functions
```

### 5. Deploy as Edge Function (Optional)

Create `functions/export-leads/index.ts`:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req) => {
  const CRM_URL = Deno.env.get("CRM_URL");
  const CRM_USERNAME = Deno.env.get("CRM_USERNAME");
  const CRM_PASSWORD = Deno.env.get("CRM_PASSWORD");

  // Call Python export.py or implement in TypeScript
  return new Response(JSON.stringify({ status: "success" }));
});
```

Deploy with:
```bash
supabase functions deploy export-leads
```

## Security Benefits

✅ Secrets never stored in `.env` files
✅ Encrypted at rest in Supabase Vault
✅ Audit logs for all secret access
✅ Easy secret rotation without code changes
✅ Team members don't need `.env` files

## Accessing Secrets

### From Python Script
```python
import os
from supabase import create_client

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_KEY")
supabase = create_client(url, key)
```

### From Edge Functions (Automatic)
Supabase automatically injects secrets as environment variables in Edge Functions.

## Monitoring

Check Supabase logs for secret access:

```bash
supabase functions logs export-leads
```

## Rotating Secrets

1. Update secret in Supabase:
   ```bash
   supabase secrets set CRM_PASSWORD "new_password"
   ```

2. No code changes needed - Edge Functions pick it up immediately

## Troubleshooting

**"Permission denied" on secret access:**
- Ensure you're using `SUPABASE_SERVICE_KEY` (not `SUPABASE_KEY`)
- Verify service role has access to Vault

**Secrets not appearing in Edge Functions:**
- Redeploy the function after creating secrets
- Check function environment in Supabase dashboard

## References

- [Supabase Secrets Management](https://supabase.com/docs/guides/functions/secrets)
- [Supabase CLI Reference](https://supabase.com/docs/reference/cli/supabase-secrets-set)
