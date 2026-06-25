# Bug Bash Plan — Pre-Launch

## Overview

A bug bash is a focused, time-boxed testing session where the entire team (engineers, PMs, designers) manually tests the application to find as many issues as possible before launch. This document defines the scope, process, and success criteria for the Esustellar final bug bash.

---

## Scope

### In Scope
- Mobile app (iOS and Android) — all screens and flows
- Stellar testnet contract interactions
- Web app (if applicable) — all user-facing flows
- API / backend integration points
- Onboarding, registration, authentication
- Wallet creation, transaction submission, balance display
- Settings, security, and account management
- Push notifications and deep links
- Offline behaviour and sync

### Out of Scope
- Third-party SDKs (unless integration point fails)
- Stellar core node performance (separate infra monitoring)
- Load / stress testing (separate performance testing track)
- Translations / i18n correctness (separate QA track)

---

## Testing Areas

### 1. Contracts (Stellar)
| Area | Focus |
|------|-------|
| Soroban contract calls | Correct responses, error handling |
| Transaction building | Serialization, fee estimation |
| Account sequence numbers | Proper incrementing, race conditions |
| Asset operations | Trustlines, transfers, balance queries |
| Contract upgradeability | Emergency pause, migration flow |

### 2. Mobile App
| Area | Focus |
|------|-------|
| Navigation | All tab/screen transitions, back button, deep links |
| Wallet | Create, import, export, delete wallet flows |
| Send/Receive | QR codes, address validation, memo field |
| Transaction history | Pagination, status updates, pending states |
| Security | Biometric lock, PIN change, session timeout |
| Settings | Preferences, network switch, about screen |
| Notifications | Permission flow, tap-to-navigate, badge count |
| Performance | Screen load times, scroll smoothness, memory |
| Error handling | Network off, timeout, server error, invalid input |
| Edge cases | Rapid tapping, double submit, large amounts |

### 3. Web App (if applicable)
| Area | Focus |
|------|-------|
| Dashboard | Data accuracy, refresh behaviour |
| Wallet connect | QR scan, session management |
| Transactions | Submit, history, status polling |

---

## Participant Assignments

| Participant | Primary Area | Secondary Area |
|-------------|--------------|----------------|
| Lead Engineer | Contracts | Mobile — Transactions |
| Mobile Engineer | Mobile — Wallet & Security | Mobile — Navigation |
| Backend Engineer | API / Backend | Stellar Integration |
| PM | Mobile — Onboarding & Settings | QA Process |
| Designer | Mobile — UI/UX, Error States | Accessibility |
| QA Lead | All Areas (coordination) | Bug tracking & triage |
| Security Engineer | Security Flows | Data Privacy |

---

## Bug Tracking Process

### Tool
- GitHub Issues with label `bug-bash-[area]` (e.g., `bug-bash-mobile`, `bug-bash-contracts`)

### Issue Template

```markdown
**Title:** [Area] Brief description (e.g., [Mobile] Send button does not respond on Android)

**Environment:**
- Device/OS: [e.g., iPhone 14 Pro / iOS 18]
- App Version: [e.g., 1.0.0 (42)]
- Network: [e.g., Stellar testnet]

**Steps to Reproduce:**
1. Go to '...'
2. Tap on '...'
3. See error

**Expected:** What should happen
**Actual:** What actually happens

**Severity:** Critical / Major / Minor / Trivial
**Frequency:** Always / Often / Sometimes / Rare
**Attachment:** [screenshot, video, logs]
```

---

## Severity Definitions

| Severity | Definition | SLA |
|----------|------------|-----|
| **Critical** | App crash, data loss, security vulnerability, flow completely broken | Fix before launch, no exceptions |
| **Major** | Feature partially broken, incorrect behaviour, poor UX that blocks user task | Fix before launch or document known issue |
| **Minor** | Cosmetic issue, non-standard wording, edge case with workaround | Fix if time allows, otherwise defer |
| **Trivial** | Typo, alignment off by 2px, very rare edge case | Log and fix post-launch |

---

## Triage Workflow

```
Bug Filed
    │
    ▼
┌─────────────────────┐
│ Triage (within 2h)  │ ← QA Lead + Tech Lead
│ - Validate bug      │
│ - Set severity      │
│ - Assign owner      │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│ Severity Assess     │
│ Critical / Major?   │──Yes──→ Immediate fix, re-test
│ Minor / Trivial?    │──No──→ Add to backlog
└─────────────────────┘
          │
          ▼
┌─────────────────────┐
│ Fix & Verify        │
│ - PR with fix       │
│ - QA re-test on RC  │
│ - Close issue       │
└─────────────────────┘
```

### Triage Schedule
- Every 2 hours during bug bash
- All Critical bugs re-triaged within 30 minutes
- Final triage at end of day to review remaining items

---

## Success Criteria

The bug bash is considered successful when:

| Criterion | Target |
|-----------|--------|
| Critical bugs found | 0 remaining at end of bug bash |
| Major bugs found | 0 remaining at end of bug bash |
| Minor bugs found | ≤ 5 remaining (documented and deferred) |
| Coverage | 100% of in-scope areas tested |
| Participants | 100% attendance, all assigned areas covered |
| Test cycles | Each area tested on both iOS and Android |
| Escaped bugs | 0 critical/major bugs found within 7 days of launch |

---

## Schedule

| Time | Activity |
|------|----------|
| Day 1 — 09:00 | Kickoff: scope review, tooling setup, area assignments |
| Day 1 — 09:30 | Testing session 1 (focused on assigned areas) |
| Day 1 — 12:00 | Standup: bugs found so far, blockers |
| Day 1 — 13:00 | Testing session 2 (cross-area testing) |
| Day 1 — 16:00 | Triage session: review all bugs, assign priority |
| Day 1 — 17:00 | Wrap-up: summary, known issues list |
| Day 2 — 09:00 | Retest fixed bugs, test edge cases |
| Day 2 — 12:00 | Final triage: review remaining bugs |
| Day 2 — 14:00 | Sign-off: success criteria check, launch go/no-go |

---

## Appendix: Quick Reference

### Test Devices
- iPhone 14 Pro (iOS 17+)
- iPhone SE (iOS 17+)
- Pixel 7 (Android 14+)
- Samsung Galaxy A54 (Android 14+)

### Network Conditions
- WiFi (low latency)
- 4G (regular latency)
- Offline (airplane mode)

### Test Data
- Use Stellar testnet (friendbot-funded accounts)
- Pre-seeded wallets with varying balances
- Known contract IDs for each scenario
