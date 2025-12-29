# Fix: Permission 'iam.serviceAccounts.getAccessToken' Denied

## Error
```
Permission 'iam.serviceAccounts.getAccessToken' denied on resource
```

## Cause
When using Workload Identity Federation, the service account needs permission to get access tokens for itself when `gcloud compute ssh` runs.

## Solution: Grant Service Account Token Creator Permission

Run this command to grant the service account permission to get its own access tokens:

```bash
PROJECT_ID=chat-history-449709

# Grant the service account permission to get its own access tokens
gcloud iam service-accounts add-iam-policy-binding \
  github-actions-deploy@${PROJECT_ID}.iam.gserviceaccount.com \
  --project=$PROJECT_ID \
  --member="serviceAccount:github-actions-deploy@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/iam.serviceAccountTokenCreator"
```

**What this does:**
- Allows the service account to impersonate itself and get access tokens
- Required for `gcloud compute ssh` to work when authenticated via WIF
- This is safe because the service account can only get tokens for itself

## Alternative: Use Service Account Key (Less Secure)

If you prefer not to grant this permission, you can switch back to using service account keys:

1. Create a service account key
2. Add it as `GCP_SA_KEY` secret in GitHub
3. Update the workflow to use `credentials_json` instead of WIF

However, granting `serviceAccountTokenCreator` is the recommended approach as it maintains the security benefits of WIF.

