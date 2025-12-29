#!/bin/bash
# Quick script to verify your GCP service account key JSON is valid
# This helps ensure the secret is set correctly in GitHub

echo "🔍 GCP Service Account Key Verification"
echo "========================================"
echo ""

if [ ! -f "key.json" ]; then
    echo "❌ Error: key.json file not found in current directory"
    echo ""
    echo "To use this script:"
    echo "1. Download your service account key from GCP Console"
    echo "2. Save it as 'key.json' in this directory"
    echo "3. Run this script again"
    exit 1
fi

echo "📄 Checking key.json file..."
echo ""

# Check if it's valid JSON
if ! jq empty key.json 2>/dev/null; then
    echo "❌ Error: key.json is not valid JSON"
    exit 1
fi

echo "✅ Valid JSON format"

# Extract key fields
PROJECT_ID=$(jq -r '.project_id' key.json)
CLIENT_EMAIL=$(jq -r '.client_email' key.json)
KEY_TYPE=$(jq -r '.type' key.json)

echo ""
echo "📋 Key Details:"
echo "   Project ID: $PROJECT_ID"
echo "   Service Account: $CLIENT_EMAIL"
echo "   Type: $KEY_TYPE"
echo ""

# Check required fields
REQUIRED_FIELDS=("type" "project_id" "private_key_id" "private_key" "client_email" "client_id" "auth_uri" "token_uri")
MISSING_FIELDS=()

for field in "${REQUIRED_FIELDS[@]}"; do
    if ! jq -e ".$field" key.json >/dev/null 2>&1; then
        MISSING_FIELDS+=("$field")
    fi
done

if [ ${#MISSING_FIELDS[@]} -gt 0 ]; then
    echo "❌ Missing required fields: ${MISSING_FIELDS[*]}"
    exit 1
fi

echo "✅ All required fields present"
echo ""

# Get the full JSON content
JSON_CONTENT=$(cat key.json)
JSON_LENGTH=${#JSON_CONTENT}

echo "📏 JSON Content Length: $JSON_LENGTH characters"
echo ""
echo "📋 To set this in GitHub:"
echo "1. Copy the ENTIRE content below (from { to })"
echo "2. Go to: GitHub Repo → Settings → Secrets and variables → Actions"
echo "3. Create/Update secret named: GCP_SA_KEY"
echo "4. Paste the entire JSON content"
echo ""
echo "--- Copy from here ---"
cat key.json
echo "--- Copy to here ---"
echo ""
echo "✅ Verification complete! The JSON above is ready to paste into GitHub secrets."

