---
name: climbcoin-ops
description: >-
  Defines ClimbCoin's core operational, verification, privacy, demand-shaping,
  and visual design rules for commercial office tower deployments. Use this
  skill whenever building, modifying, testing, or auditing ClimbCoin
  verification logic, telemetry pipelines, multiplier algorithms, employer
  dashboards, or UI components.
---

# ClimbCoin Operations & Verification Rules

Follow these domain rules strictly across all ClimbCoin backend services,
verification engines, analytics pipelines, and frontend surfaces.

## 1. 3-Signal Anti-Cheat Verification

Stairwell NFC tap-in / tap-out events are **location anchors**, never proof of a
climb. Every trip telemetry payload (`startFloor`, `endFloor`, `elapsedSeconds`,
`totalSteps`, `avgCadenceSpm`, `verticalBounceScore`, `elevationDeltaMeters`)
must pass three independent signals:

| Signal | Rule / Threshold | Failure Condition |
| :--- | :--- | :--- |
| **Signal 01 — Elevation** (`elevationPass`) | `elevationDeltaMeters` matches the tapped floor difference at **~3.5 m per floor**. | Barometric elevation gain does not align with `|endFloor - startFloor| * 3.5 m`. |
| **Signal 02 — Cadence** (`cadencePass`) | `avgCadenceSpm >= 55` **AND** `verticalBounceScore >= 0.35`. | Near-zero cadence or bounce indicates a stationary lift ride (`LIFT_SPOOF`); scores `0` points. |
| **Signal 03 — Plausibility** (`plausibilityPass`) | `elapsedSeconds` falls within **6–45 seconds per floor**. | Physically implausible duration (e.g., too fast for human stair climbing) flags `SPEED_ANOMALY`; scores `0` points. |

### Verdict Mapping
- **`VERIFIED_CLIMB`**: All three signals pass (`elevationPass && cadencePass && plausibilityPass`). Award points with the active multiplier.
- **`LIFT_SPOOF`**: `cadencePass` is `false` (elevation without climbing gait). Award `0` points.
- **`SPEED_ANOMALY`**: `plausibilityPass` is `false` (or elapsed time violates the 6–45 s/floor human range). Award `0` points and flag for ops triage.

## 2. Privacy Boundary Rule

- **Never** store, expose via API, or render individual employee names, user IDs,
  or per-person movement logs on the employer dashboard.
- Employer and facilities views must strictly report **department-level** and
  **floor-level** aggregates only (e.g., peak lift load reduction, floors
  climbed by department/floor, estimated kWh saved, and retention curves).
- Individual balances, streaks, and trip histories belong exclusively to the
  occupant's personal mobile app.

## 3. Dynamic Demand-Shaping Rules

Point multipliers actively shape vertical traffic across lifts and stairwells:

- **Lift Peak Rush (Incentivize Stairs)**: Raise point multipliers **up to
  `2.5x`** during peak elevator demand windows (morning arrival, lunch rush,
  evening exit) to divert traffic from lifts into stairwells.
- **Stairwell Congestion Guardrail (Throttle Crowd)**: Automatically lower the
  point multiplier to **`0.75x`** whenever a stairwell exceeds **25 active
  climbers/min** to prevent crowding and preserve stairwell safety.
- **Capped Pool Protection**: Multipliers may also scale down within the
  configured reward pool cap so client budget exposure remains strictly bounded.

## 4. Visual Design System Reference

- Always pull colors, typography, and surface tokens from
  `reference/climbcoin.html` (also mirrored in `climbcoin-mvp-reference/climbcoin.html`
  in this workspace) before styling any ClimbCoin UI or dashboard.
- Do not invent ad-hoc palettes or light-mode overrides; preserve the committed
  dark identity defined in `reference/climbcoin.html`:
  - **Surfaces & Lines**: `--ground: #0A0D0C`, `--surface: #131816`,
    `--surface-2: #1A211E`, `--line: #232B28`, `--line-soft: #1B2320`
  - **Text**: `--ink: #E9EFEC`, `--ink-dim: #B4C0BB`, `--muted: #879490`
  - **Accents**: `--climb: #00E39D`, `--climb-dim: #0B5F45`,
    `--on-climb: #052018`, `--system: #8B6FFF`, `--system-dim: #2E2456`,
    `--warn: #F2A93B`
  - **Typography**: Display `"Archivo"`, Body `"Public Sans"`, Mono
    `"JetBrains Mono"`

## 5. Verification Checklist

Before finalizing any ClimbCoin change, verify:
1. All three anti-cheat thresholds (`~3.5m/floor`, `avgCadenceSpm >= 55` &
   `verticalBounceScore >= 0.35`, `6–45s/floor`) are enforced and covered by
   unit tests (including lift-spoof and speed-anomaly edge cases).
2. No employer dashboard query, response payload, or UI component contains
   individual employee names or user-level movement records.
3. Multiplier logic respects both the `2.5x` peak-rush ceiling and the `0.75x`
   congestion throttle above `25` active climbers/min.
4. UI styles match the CSS variables and fonts in `reference/climbcoin.html`.
