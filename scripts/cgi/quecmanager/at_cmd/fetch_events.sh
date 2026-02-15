#!/bin/sh
# =============================================================================
# fetch_events.sh — CGI Endpoint for Recent Activities / Network Events
# =============================================================================
# Serves the network events NDJSON file as a JSON array to the frontend.
# Zero modem contact — reads from RAM only.
#
# The events file is NDJSON (one JSON object per line). This script converts
# it to a proper JSON array for the frontend.
#
# Endpoint: GET /cgi-bin/quecmanager/at_cmd/fetch_events.sh
# Response: application/json
#
# Install location: /www/cgi-bin/quecmanager/at_cmd/fetch_events.sh
# =============================================================================

EVENTS_FILE="/tmp/qmanager_events.json"

# --- HTTP Headers ------------------------------------------------------------
echo "Content-Type: application/json"
echo "Cache-Control: no-cache, no-store, must-revalidate"
echo "Access-Control-Allow-Origin: *"
echo ""

# --- Serve events as JSON array ----------------------------------------------
if [ -f "$EVENTS_FILE" ] && [ -s "$EVENTS_FILE" ]; then
    # Convert NDJSON (one object per line) to a JSON array
    # awk: print each line with a comma after it, except the last
    echo "["
    awk 'NR>1{print prev","} {prev=$0} END{if(NR>0) print prev}' "$EVENTS_FILE"
    echo "]"
else
    echo "[]"
fi
