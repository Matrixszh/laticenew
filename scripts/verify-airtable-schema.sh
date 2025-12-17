#!/bin/bash
# Verify Airtable schema matches expected structure (tables + fields)

set -e

# Load env vars
if [ -f .env.local ]; then
  export $(cat .env.local | grep -v '^#' | xargs)
fi

BASE_ID="${AIRTABLE_BASE_ID}"
TOKEN="${AIRTABLE_TOKEN}"

if [ -z "$BASE_ID" ] || [ -z "$TOKEN" ]; then
  echo "❌ Error: AIRTABLE_BASE_ID and AIRTABLE_TOKEN must be set"
  exit 1
fi

echo "🔍 Verifying Airtable schema (tables + fields)..."
echo ""

# Use the drift report script for comprehensive verification
# This checks both tables and fields
if command -v npm &> /dev/null; then
  # Check if tsx is available (needed for TypeScript execution)
  if npm list tsx &> /dev/null || npm list -g tsx &> /dev/null || command -v tsx &> /dev/null; then
    npm run airtable:drift
    EXIT_CODE=$?
    if [ $EXIT_CODE -eq 0 ]; then
      echo ""
      echo "✅ Schema verification passed!"
      exit 0
    else
      echo ""
      echo "❌ Schema verification failed. See drift report above."
      exit 1
    fi
  else
    echo "⚠️  tsx not found. Installing tsx for field verification..."
    npm install --save-dev tsx
    npm run airtable:drift
    EXIT_CODE=$?
    if [ $EXIT_CODE -eq 0 ]; then
      echo ""
      echo "✅ Schema verification passed!"
      exit 0
    else
      echo ""
      echo "❌ Schema verification failed. See drift report above."
      exit 1
    fi
  fi
else
  echo "❌ npm not found. Cannot run field verification."
  echo "   Falling back to basic table check..."
  
  # Fallback to basic table check
  RESPONSE=$(curl -s "https://api.airtable.com/v0/meta/bases/$BASE_ID/tables" \
    -H "Authorization: Bearer $TOKEN")

  if echo "$RESPONSE" | grep -q '"error"'; then
    echo "❌ API Error:"
    echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"
    exit 1
  fi

  TABLE_NAMES=$(echo "$RESPONSE" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    tables = data.get('tables', [])
    names = [t['name'] for t in tables]
    print('\\n'.join(names))
except Exception as e:
    print(f'Error: {e}', file=sys.stderr)
    sys.exit(1)
")

  echo "📊 Found tables:"
  echo "$TABLE_NAMES" | while read table; do
    echo "  - $table"
  done

  echo ""
  echo "✅ Expected tables:"
  EXPECTED="Businesses Onboarding Leads Interactions Appointments PromptOverrides Automations BusyBlocks Users"
  MISSING=0
  for table in $EXPECTED; do
    if echo "$TABLE_NAMES" | grep -q "^$table$"; then
      echo "  ✅ $table"
    else
      echo "  ❌ $table (missing)"
      MISSING=1
    fi
  done

  if [ $MISSING -eq 1 ]; then
    echo ""
    echo "⚠️  Some tables are missing. Install tsx and run 'npm run airtable:drift' for full field verification."
    exit 1
  fi
fi
