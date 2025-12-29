# GCP Authentication Setup for GitHub Actions

This guide explains how to set up GCP authentication for the GitHub Actions deployment workflow.

## Option 1: Service Account Key (Current Setup)

### Steps to Set Up:

1. **Create a Service Account in GCP:**
   ```bash
   # Set your project ID
   export PROJECT_ID="chat-history-449709"
   
   # Create service account
   gcloud iam service-accounts create github-actions-deploy \
     --display-name="GitHub Actions Deploy" \
     --project=chat-history-449709
   ```

2. **Grant Required Permissions:**
   ```bash
   # Grant compute instance access (for SSH via IAP)
   gcloud projects add-iam-policy-binding $PROJECT_ID \
     --member="serviceAccount:github-actions-deploy@${PROJECT_ID}.iam.gserviceaccount.com" \
     --role="roles/compute.instanceAdmin.v1"
   
   # Grant IAP tunnel access
   gcloud projects add-iam-policy-binding $PROJECT_ID \
     --member="serviceAccount:github-actions-deploy@${PROJECT_ID}.iam.gserviceaccount.com" \
     --role="roles/iap.tunnelResourceAccessor"
   ```

3. **Create and Download Service Account Key:**
   ```bash
   # Create key
   gcloud iam service-accounts keys create key.json \
     --iam-account=github-actions-deploy@${PROJECT_ID}.iam.gserviceaccount.com
   
   # Copy the entire JSON content
   cat key.json
   ```

4. **Add Secret to GitHub:**
   - Go to your GitHub repository
   - Navigate to: **Settings** → **Secrets and variables** → **Actions**
   - Click **New repository secret**
   - Name: `GCP_SA_KEY`
   - Value: Paste the **entire JSON content** from `key.json`
   - Click **Add secret**

5. **Verify the Secret:**
   - The secret should contain the full JSON, starting with `{` and ending with `}`
   - It should include fields like: `type`, `project_id`, `private_key_id`, `private_key`, `client_email`, etc.

## Option 2: Workload Identity Federation (Recommended - More Secure)

Workload Identity Federation eliminates the need to store service account keys.

### Steps to Set Up:

1. **Enable Required APIs:**
   ```bash
   gcloud services enable iamcredentials.googleapis.com \
     --project=$PROJECT_ID
   ```

2. **Create Workload Identity Pool:**
   ```bash
   gcloud iam workload-identity-pools create github-actions-pool \
     --project=$PROJECT_ID \
     --location="global" \
     --display-name="GitHub Actions Pool"
   ```

3. **Create Workload Identity Provider:**
   ```bash
   # If github-provider already exists (even in DELETED state), use a different name like github-provider-v2
   gcloud iam workload-identity-pools providers create-oidc github-provider-v2 \
     --project=$PROJECT_ID \
     --location="global" \
     --workload-identity-pool="github-actions-pool" \
     --display-name="GitHub Provider" \
     --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository,attribute.repository_owner=assertion.repository_owner" \
     --attribute-condition="assertion.repository_owner=='abozaid010' && assertion.repository=='lenaai-website'" \
     --issuer-uri="https://token.actions.githubusercontent.com"
   ```
   
   **Important:** 
   - Repository: `https://github.com/abozaid010/lenaai-website`
   - Owner: `abozaid010`, Repository: `lenaai-website`
   - The `--attribute-condition` is required and must reference the mapped attributes (`repository_owner` and `repository`)
   - This restricts access to only your specific repository
   - **Current provider name:** `github-provider-v2` (use this in step 7)

4. **Create Service Account (or verify if it exists):**
   ```bash
   # Check if service account already exists
   if gcloud iam service-accounts describe github-actions-deploy@${PROJECT_ID}.iam.gserviceaccount.com --project=$PROJECT_ID &>/dev/null; then
     echo "✅ Service account already exists: github-actions-deploy@${PROJECT_ID}.iam.gserviceaccount.com"
   else
     echo "📝 Creating new service account..."
     gcloud iam service-accounts create github-actions-deploy \
       --display-name="GitHub Actions Deploy" \
       --project=$PROJECT_ID
   fi
   ```
   
   **Note:** If you get an error that the service account already exists, that's fine - you can proceed to the next step.

5. **Grant Permissions:**
   ```bash
   # Grant compute instance access (idempotent - safe to run multiple times)
   gcloud projects add-iam-policy-binding $PROJECT_ID \
     --member="serviceAccount:github-actions-deploy@${PROJECT_ID}.iam.gserviceaccount.com" \
     --role="roles/compute.instanceAdmin.v1"
   
   # Grant IAP tunnel access (idempotent - safe to run multiple times)
   gcloud projects add-iam-policy-binding $PROJECT_ID \
     --member="serviceAccount:github-actions-deploy@${PROJECT_ID}.iam.gserviceaccount.com" \
     --role="roles/iap.tunnelResourceAccessor"
   ```
   
   **Note:** These commands are idempotent - they won't create duplicates if permissions already exist.

6. **Allow GitHub Actions to Impersonate Service Account:**
   ```bash
   # Get your project number (needed for the full provider path)
   PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format="value(projectNumber)")
   
   # Allow GitHub repository to impersonate the service account
   # Using attribute.repository since we mapped it in step 3
   # Repository: https://github.com/abozaid010/lenaai-website
   gcloud iam service-accounts add-iam-policy-binding \
     github-actions-deploy@${PROJECT_ID}.iam.gserviceaccount.com \
     --project=$PROJECT_ID \
     --role="roles/iam.workloadIdentityUser" \
     --member="principalSet://iam.googleapis.com/projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/github-actions-pool/attribute.repository/abozaid010/lenaai-website"
   ```
   
   **Note:** 
   - Repository: `https://github.com/abozaid010/lenaai-website`
   - This uses `attribute.repository` which we mapped in step 3, making it simpler than using subject patterns

7. **Add Secrets to GitHub:**
   ```bash
   # Get your project number
   PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format="value(projectNumber)")
   
   # Display the values to copy (use github-provider-v2 if that's what you created)
   echo "WIF_PROVIDER: projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/github-actions-pool/providers/github-provider-v2"
   echo "WIF_SERVICE_ACCOUNT: github-actions-deploy@${PROJECT_ID}.iam.gserviceaccount.com"
   ```
   
   **Current values (update these in GitHub secrets):**
   - `WIF_PROVIDER`: `projects/1038492270338/locations/global/workloadIdentityPools/github-actions-pool/providers/github-provider-v2`
   - `WIF_SERVICE_ACCOUNT`: `github-actions-deploy@chat-history-449709.iam.gserviceaccount.com`
   
   Then go to your GitHub repository:
   - Navigate to: **Settings** → **Secrets and variables** → **Actions**
   - Add these secrets:
     - `WIF_PROVIDER`: Copy the value from above
     - `WIF_SERVICE_ACCOUNT`: Copy the value from above

8. **Update Workflow File:**
   
   The workflow file has already been updated to use Workload Identity Federation. Verify that `.github/workflows/deploy.yml` contains:
   
   ```yaml
   - name: Authenticate to Google Cloud
     id: auth
     uses: google-github-actions/auth@v2
     with:
       workload_identity_provider: ${{ secrets.WIF_PROVIDER }}
       service_account: ${{ secrets.WIF_SERVICE_ACCOUNT }}
   ```
   
   **If you need to switch from service account keys to WIF**, replace the authentication step:
   
   **Before (using service account key):**
   ```yaml
   - name: Authenticate to Google Cloud
     uses: google-github-actions/auth@v2
     with:
       credentials_json: ${{ secrets.GCP_SA_KEY }}
   ```
   
   **After (using Workload Identity Federation):**
   ```yaml
   - name: Authenticate to Google Cloud
     uses: google-github-actions/auth@v2
     with:
       workload_identity_provider: ${{ secrets.WIF_PROVIDER }}
       service_account: ${{ secrets.WIF_SERVICE_ACCOUNT }}
   ```
   
   **Note:** The workflow file should already be configured correctly. Just ensure the secrets `WIF_PROVIDER` and `WIF_SERVICE_ACCOUNT` are set in GitHub repository settings.

## Troubleshooting

### Error: "must specify exactly one of workload_identity_provider or credentials_json"

**Cause:** The secret is empty or not properly set.

**Solution:**
1. Check that `GCP_SA_KEY` secret exists in GitHub repository settings
2. Verify the secret contains the full JSON content (not just a filename)
3. Make sure there are no extra spaces or newlines at the beginning/end
4. The JSON should be valid (you can validate it with `cat key.json | jq .`)

### Error: "Failed to authenticate"

**Cause:** Service account doesn't have required permissions.

**Solution:**
1. Verify the service account has `roles/compute.instanceAdmin.v1`
2. Verify the service account has `roles/iap.tunnelResourceAccessor`
3. Check that the VM instance exists and is accessible

### Error: "Permission denied" when running gcloud commands

**Cause:** Insufficient IAM permissions.

**Solution:**
1. Ensure the service account has the correct roles
2. Check that IAP is enabled for your VM
3. Verify the VM's firewall rules allow IAP traffic

### Error: "The given credential is rejected by the attribute condition"

**Cause:** The Workload Identity Provider's attribute condition doesn't match your GitHub repository.

**Symptoms:**
```
Error: google-github-actions/auth failed with: failed to generate Google Cloud federated token: 
{"error":"unauthorized_client","error_description":"The given credential is rejected by the attribute condition."}
```

**Solution:**
1. Verify your repository owner and name match the attribute condition:
   ```bash
   # Check current provider configuration
   gcloud iam workload-identity-pools providers describe github-provider-v2 \
     --project=chat-history-449709 \
     --location=global \
     --workload-identity-pool=github-actions-pool \
     --format="yaml(attributeCondition)"
   ```

2. The attribute condition should match your repository:
   - Repository: `https://github.com/abozaid010/lenaai-website`
   - Condition should be: `assertion.repository_owner=='abozaid010' && assertion.repository=='lenaai-website'`

3. If the condition is wrong, you need to recreate the provider (providers can't be updated, only deleted and recreated):
   ```bash
   # Delete old provider (if needed)
   gcloud iam workload-identity-pools providers delete github-provider-v2 \
     --project=chat-history-449709 \
     --location=global \
     --workload-identity-pool=github-actions-pool \
     --quiet
   
   # Wait a few seconds, then create new one with correct condition
   gcloud iam workload-identity-pools providers create-oidc github-provider-v2 \
     --project=chat-history-449709 \
     --location=global \
     --workload-identity-pool=github-actions-pool \
     --display-name="GitHub Provider" \
     --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository,attribute.repository_owner=assertion.repository_owner" \
     --attribute-condition="assertion.repository_owner=='abozaid010' && assertion.repository=='lenaai-website'" \
     --issuer-uri="https://token.actions.githubusercontent.com"
   ```

4. Update the `WIF_PROVIDER` secret in GitHub with the new provider path if you changed the provider name.

## Security Best Practices

- ✅ Use Workload Identity Federation when possible (no keys to manage)
- ✅ Rotate service account keys regularly if using Option 1
- ✅ Use least-privilege IAM roles
- ✅ Monitor access logs in GCP Console
- ✅ Never commit service account keys to git
- ✅ Use separate service accounts for different environments

