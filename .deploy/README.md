# lenaAI-website Secure Deployment

## Overview
This directory contains the secure deployment setup for lenaAI-website using GCP IAP tunnel authentication.

## Files
- `sync-repo.sh` - Fetches latest `main` on the VM (`fetch` + `reset --hard`); fails if git sync or commit mismatch
- `deploy.sh` - Runs `sync-repo.sh`, then builds Docker image and deploys
- `README.md` - This documentation

## Deployment Process
1. GitHub Actions authenticates with GCP
2. IAP tunnel establishes secure connection to VM
3. `deploy.sh` runs `sync-repo.sh` to match `origin/main` (verified against `${{ github.sha }}`)
4. Docker image is built and the container is restarted

## Security Features
- ✅ No SSH keys stored in GitHub
- ✅ No service account keys stored in GitHub (using Workload Identity Federation)
- ✅ IAP tunnel authentication
- ✅ Least privilege service account
- ✅ Audit logging in GCP
- ✅ No public SSH exposure
- ✅ Token-based authentication (no long-lived credentials)

## Manual Deployment
If needed, you can run the deployment manually:

```bash
gcloud compute ssh lenaai-vm-7gx4 \
  --zone=europe-west3-a \
  --tunnel-through-iap \
  --command='bash ~/lenaai-website/.deploy/deploy.sh'
```

Manual deploy also runs `sync-repo.sh` first. To pin a specific commit:

```bash
EXPECTED_SHA=<full-git-sha> bash ~/lenaai-website/.deploy/deploy.sh
```
