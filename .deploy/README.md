# lenaAI-website Secure Deployment

## Overview
This directory contains the secure deployment setup for lenaAI-website using GCP IAP tunnel authentication.

## Files
- `deploy.sh` - Main deployment script that runs on GCP VM
- `README.md` - This documentation

## Deployment Process
1. GitHub Actions authenticates with GCP service account
2. IAP tunnel establishes secure connection to VM
3. Deployment script pulls code, builds Docker image, and deploys

## Security Features
- ✅ No SSH keys stored in GitHub
- ✅ IAP tunnel authentication
- ✅ Least privilege service account
- ✅ Audit logging in GCP
- ✅ No public SSH exposure

## Manual Deployment
If needed, you can run the deployment manually:

```bash
gcloud compute ssh frankfurt-mig-regional-85p8 \
  --zone=europe-west3-a \
  --tunnel-through-iap \
  --command='bash ~/lenaai-website/.deploy/deploy.sh'
```
