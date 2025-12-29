# Quick Fix: GCP Authentication Error

## Error Message
```
Error: google-github-actions/auth failed with: the GitHub Action workflow must specify exactly one of "workload_identity_provider" or "credentials_json"!
```

## Cause
The `GCP_SA_KEY` secret in GitHub is either:
- Not set at all
- Empty
- Contains invalid/partial JSON

## Solution Steps

### Step 1: Get Your Service Account Key

**Option A: Download from GCP Console**
1. Go to [GCP Console](https://console.cloud.google.com/)
2. Navigate to **IAM & Admin** → **Service Accounts**
3. Find your service account (or create one if needed)
4. Click on the service account
5. Go to **Keys** tab
6. Click **Add Key** → **Create new key**
7. Choose **JSON** format
8. Download the key file

**Option B: Create via gcloud CLI**
```bash
# Set your project ID
export PROJECT_ID="your-project-id"

# Create service account (if needed)
gcloud iam service-accounts create github-actions-deploy \
  --display-name="GitHub Actions Deploy" \
  --project=$PROJECT_ID

# Create and download key
gcloud iam service-accounts keys create key.json \
  --iam-account=github-actions-deploy@${PROJECT_ID}.iam.gserviceaccount.com
```

### Step 2: Verify the Key (Optional but Recommended)

```bash
# Copy the key file to .deploy directory
cp key.json .deploy/key.json

# Run verification script
cd .deploy
./verify-secret.sh
```

This will show you the exact content to copy.

### Step 3: Set GitHub Secret

1. Open your GitHub repository
2. Go to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret** (or edit existing `GCP_SA_KEY`)
4. Name: `GCP_SA_KEY`
5. Value: **Copy the ENTIRE JSON content** from your key file
   - It should start with `{` and end with `}`
   - Include ALL fields (type, project_id, private_key, etc.)
   - Don't add extra spaces or newlines
6. Click **Add secret**

### Step 4: Verify Secret Format

The secret should look like this (example):
```json
{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "github-actions-deploy@your-project-id.iam.gserviceaccount.com",
  "client_id": "...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  ...
}
```

### Step 5: Test the Deployment

1. Push a commit to `main` branch (or manually trigger the workflow)
2. Check the Actions tab for the workflow run
3. The authentication step should now succeed

## Common Mistakes

❌ **Wrong:** Only copying part of the JSON  
✅ **Correct:** Copy the entire JSON file content

❌ **Wrong:** Adding the JSON to a file and referencing the filename  
✅ **Correct:** Paste the raw JSON content directly into the secret

❌ **Wrong:** Using a different secret name  
✅ **Correct:** Use exactly `GCP_SA_KEY`

❌ **Wrong:** Secret contains extra whitespace or formatting  
✅ **Correct:** Use the raw JSON as-is from the downloaded file

## Still Having Issues?

1. **Double-check the secret name:** Must be exactly `GCP_SA_KEY`
2. **Verify JSON validity:** Use `cat key.json | jq .` to validate
3. **Check service account permissions:** Ensure it has `roles/compute.instanceAdmin.v1` and `roles/iap.tunnelResourceAccessor`
4. **Review workflow logs:** Check the full error message in GitHub Actions

## Alternative: Use Workload Identity Federation

If you continue having issues, consider switching to Workload Identity Federation (more secure, no keys to manage). See `.deploy/SETUP_GCP_AUTH.md` for instructions.

