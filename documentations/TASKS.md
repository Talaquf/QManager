# QManager Task Tracker

**Last Updated:** February 16, 2026

This file tracks component wiring progress, active work, and remaining tasks.  
For architecture, AT command reference, JSON contract, and deployment notes, see `DEVELOPMENT_LOG.md`.

---

## Page Wiring Progress

### Home Page Dashboard (`/dashboard`) — ✅ COMPLETE

All 10 home page components are wired to live data and functional.

| Component | File | Status | Data Source |
|-----------|------|--------|-------------|
| **Network Status** | `network-status.tsx` | ✅ Done | `data.network` + `data.modem_reachable` — network type icon, carrier, SIM slot, service status with pulsating rings, radio badge, loading skeletons, stale indicator |
| **4G Primary Status** | `lte-status.tsx` | ✅ Done | `data.lte` — band, EARFCN, PCI, RSRP, RSRQ, RSSI, SINR |
| **5G Primary Status** | `nr-status.tsx` | ✅ Done | `data.nr` — band, ARFCN, PCI, RSRP, RSRQ, SINR, SCS |
| **Device Information** | `device-status.tsx` | ✅ Done | `data.device` — firmware, build date, manufacturer, IMEI, IMSI, ICCID, phone, LTE category, MIMO |
| **Device Metrics** | `device-metrics.tsx` | ✅ Done | `data.device` (temp, CPU, memory, uptime) + `data.traffic` (live traffic, data usage) + `data.lte`/`data.nr` (TA cell distance) |
| **Internet Badge** | `network-status.tsx` | ✅ Done | `data.connectivity.internet_available` — three-state badge (green/red/gray) |
| **Live Latency** | `live-latency.tsx` | ✅ Done | `data.connectivity` — line chart, stats row, Online/Offline badge, speedtest button |
| **Recent Activities** | `recent-activities.tsx` | ✅ Done | Self-contained: `useRecentActivities()` hook, polls events CGI every 10s |
| **Signal History** | `signal-history.tsx` | ✅ Done | Self-contained: `useSignalHistory()` hook, per-antenna NDJSON, metric toggle, time range |
| **Speedtest Dialog** | `speedtest-dialog.tsx` | ✅ Done | On-demand via `speedtest_*.sh` CGI endpoints, no modem interaction |

### Cellular Information Page (`/cellular`) — ✅ COMPLETE

| Component | File | Status | Data Source |
|-----------|------|--------|-------------|
| **Cellular Information** | `cell-data.tsx` | ✅ Done | `data.network` (ISP, APN, type, CA, bandwidth, WAN IP, DNS) + `data.lte`/`data.nr` (Cell ID, TAC) + `data.device` (MIMO) |
| **Active Bands** | `active-bands.tsx` | ✅ Done | Per-carrier QCAINFO data. Accordion UI with signal bars, badges (LTE/NR, PCC/SCC), bandwidth, EARFCN, PCI. |

**Cellular Information card — implementation details:**

- Parent `cellular-information.tsx` is `"use client"`, calls `useModemStatus()`, passes data down
- 12 rows: ISP, APN (+ Edit link → `/cellular/settings/apn-management`), Network Type, Cell ID (tooltip: eNodeB/gNodeB + Sector), TAC (tooltip: hex), Total Bandwidth (tooltip: per-band breakdown), Carrier Aggregation, Active MIMO, WAN IPv4, WAN IPv6 (truncated + tooltip), Primary DNS, Secondary DNS
- SA-aware: Cell ID/TAC sourced from `nr` in SA mode, `lte` otherwise
- Loading skeleton, null handling, monospace fonts for IP/DNS

**Backend tasks completed for this card:**

| Task | Description | Status |
|------|-------------|--------|
| Cell ID + TAC parsing | `_compute_cell_parts()` / `_hex_to_dec()` in `parse_at.sh`, LTE 28-bit and NR 36-bit decomposition | ✅ Done |
| QCAINFO bandwidth | `parse_ca_bandwidth()` in `parse_at.sh`, sums PCC + all SCCs across LTE and NR, builds per-band tooltip string | ✅ Done |
| AT+CGCONTRDP parser | `parse_cgcontrdp()` — extracts APN, primary/secondary DNS from first non-IMS profile | ✅ Done |
| AT+QMAP="WWAN" parser | `parse_wan_ip()` — extracts WAN IPv4 and IPv6, filters all-zero IPv6 as "none" | ✅ Done |
| TypeScript types | Added 7 fields to `NetworkStatus` interface in `types/modem-status.ts` | ✅ Done |
| Frontend wiring | `cell-data.tsx` converted from hardcoded to data-driven with props from `useModemStatus()` | ✅ Done |

**Active Bands card — implementation details:**

- `parse_ca_info()` in `parse_at.sh` extended to build per-carrier JSON array (`t2_carrier_components`)
- Parses LTE PCC/SCC lines (field pos: type,freq,bw_rb,band,state,PCI,RSRP,RSRQ,RSSI,RSSNR)
- Parses NR lines in two forms: short (5–8 fields) and long (9–12 fields, with UL info)
- NR_SNR converted from raw /100 to actual dB (3GPP spec) via awk
- Sanitizes empty/dash/non-numeric values → `null`
- Frontend: Accordion with expandable per-band detail. Technology badge (LTE=green, NR=blue), PCC/SCC badge, signal progress bars with quality coloring, bandwidth/EARFCN/PCI info rows
- `signalToProgress()` utility maps signal dBm/dB to 0–100% using threshold ranges

| Task | Description | Status |
|------|-------------|--------|
| QCAINFO per-carrier parsing | Extended `parse_ca_info()` to output JSON array with per-band details | ✅ Done |
| NR_SNR conversion | Raw /100 conversion for NR SNR values in awk | ✅ Done |
| Poller state + JSON output | `t2_carrier_components` state var, written to `network.carrier_components` in cache | ✅ Done |
| TypeScript types | `CarrierComponent` interface, `carrier_components` in `NetworkStatus`, `signalToProgress()` | ✅ Done |
| Frontend wiring | Accordion UI with signal metrics, badges, loading/empty states | ✅ Done |

---

## Remaining Work

### Pages

| # | Task | Status | Notes |
|---|------|--------|-------|
| 1 | **Active Bands card** | ✅ Done | Per-carrier QCAINFO parser rework. JSON array with band/earfcn/bw/pci/rsrp/rsrq/sinr per CC. NR_SNR /100 conversion. |
| 2 | **Terminal Page** | ⬜ TODO | Wire to `send_command.sh` CGI endpoint (POST). Block `QSCAN` with user-facing message. |
| 3 | **Cell Scanner Page** | ⬜ TODO | Dedicated endpoint for `AT+QSCAN` with progress indicator and long-command flag coordination. |
| 4 | **Band Locking / APN Management** | ⬜ TODO | Write-path CGI endpoints (currently only read-path exists). |

### Watchcat & Recovery

| # | Task | Status | Notes |
|---|------|--------|-------|
| 5 | **Build `qmanager_watchcat`** | ⬜ TODO | State machine daemon: MONITOR→SUSPECT→RECOVERY→COOLDOWN→LOCKED. Reads ping data, tiered recovery (ifup → AT+CFUN → reboot). Token-bucket bootloop protection. |
| 6 | **Wire watchcat state to UI** | ⬜ TODO | Status indicator: watchcat state, failure count, last recovery action. |
| 7 | **Rename watchcat lock** | ⬜ TODO | `/tmp/qmanager.lock` → `/tmp/qmanager_watchcat.lock` to avoid collision with serial port lock. |

### Backend Improvements

| # | Task | Status | Notes |
|---|------|--------|-------|
| 8 | **Error recovery testing** | ⬜ TODO | SIM ejection, modem unresponsive, `sms_tool` crash, stale lock scenarios. |
| 9 | **Long command support** | ⬜ TODO | Verify `AT+QSCAN` flag-based coordination between poller and Cell Scanner page. |

### Completed (Archived)

<details>
<summary>Click to expand completed items</summary>

- ~~Wire `NrStatusComponent`~~ ✅
- ~~Wire `DeviceStatus`~~ ✅
- ~~Wire `DeviceMetricsComponent`~~ ✅
- ~~Wire `SignalHistoryComponent`~~ ✅
- ~~Build `qmanager_ping`~~ ✅ — Unified ping daemon, dual-target ICMP, hysteresis, ring buffer
- ~~Integrate ping data into poller~~ ✅ — `read_ping_data()`, staleness check, connectivity merge
- ~~Wire Internet badge~~ ✅ — Three-state badge in `network-status.tsx`
- ~~Update init script~~ ✅ — Multi-instance procd
- ~~Fix connection uptime~~ ✅ — Keyed off ping daemon, three-state logic
- ~~Build Live Latency component~~ ✅ — Line chart, stats grid, Online/Offline badge
- ~~NR MIMO layers~~ ✅ — Moved to Tier 2, `nr5g_mimo_layers` (not `nr_mimo_layers`)
- ~~TA-based cell distance~~ ✅ — LTE + NR, 3GPP formulas, BusyBox-safe parsing
- ~~NSA SCS parsing~~ ✅ — Fixed `\r` carriage return on last CSV field
- ~~Active Bands card~~ ✅ — Per-carrier QCAINFO parser rework, JSON array output, NR_SNR /100 conversion, accordion UI

</details>

---

## Component Reference: Network Status

**Props:** `data: NetworkStatus | null`, `modemReachable: boolean`, `isLoading: boolean`, `isStale: boolean`

**Radio Badge Logic:**

| Condition | Display |
|-----------|---------|
| `modemReachable === true` | 🟢 Radio On |
| `modemReachable === false` | 🔴 Radio Off |

**Network Type Circle:**

| Condition | Icon | Label / Sublabel |
|-----------|------|------------------|
| `5G-NSA` | `MdOutline5G` | "5G Signal" / "5G + LTE" |
| `5G-NSA` + NR CA | `MdOutline5G` | "5G Signal" / "5G + LTE / NR-CA" |
| `5G-SA` | `MdOutline5G` | "5G Signal" / "Standalone" |
| `LTE` + CA | `Md4gPlusMobiledata` | "LTE+ Signal" / "4G Carrier Aggregation" |
| `LTE` no CA | `Md4gMobiledata` | "LTE Signal" / "4G Connected" |
| No 4G/5G | `Md3gMobiledata` (dimmed) | "Signal" / "No 4G/5G" |

## Component Reference: Recent Activities — Event Severity Model

Events are **positive** (green ✅) or **negative** (red ❌). Frontend maps `info` → check, `warning`/`error` → X.

**Positive** (`severity: "info"`): modem signal restored, network mode upgrade, 5G NR anchor acquired, CA activated, carrier count increased, internet restored, band change, cell handoff.

**Negative** (`severity: "warning"`): modem unreachable, network mode downgrade, 5G NR anchor lost, CA deactivated, carrier count decreased, internet lost.

**Downgrade detection:** `case` match on `"$prev-$current"` pairs. `5G-SA-5G-NSA`, `5G-SA-LTE`, `5G-NSA-LTE` → warning. Carrier count decrease → warning.

---

*End of Task Tracker*
