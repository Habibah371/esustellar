# UX Audit — Consistency Checklist & Report

## Purpose

A systematic audit of the Esustellar mobile app's UX flows to ensure consistency across all screens in navigation patterns, visual design, form interactions, error/loading/empty states, and accessibility.

---

## Screens to Review

| # | Screen | Platform Notes |
|---|--------|----------------|
| 1 | Onboarding — Welcome | Carousel or single screen? |
| 2 | Onboarding — Create Wallet | Seed phrase generation |
| 3 | Onboarding — Import Wallet | Seed/secret key input |
| 4 | Onboarding — Biometric Setup | Permission prompt |
| 5 | Home / Dashboard | Balance overview, quick actions |
| 6 | Send — Select Asset | Asset list with balances |
| 7 | Send — Enter Amount | Amount input, fee display |
| 8 | Send — Confirm | Summary, confirm button |
| 9 | Send — Success / Failure | Result screen |
| 10 | Receive — Display Address | QR code, copy button |
| 11 | Receive — Request Amount | Optional amount input |
| 12 | Transactions — List | Paginated history |
| 13 | Transactions — Detail | Single transaction view |
| 14 | Settings — Main | List of settings sections |
| 15 | Settings — Security | PIN/biometric change |
| 16 | Settings — Network | Network switcher |
| 17 | Settings — About | Version, licenses |
| 18 | Notifications — List | In-app notification history |
| 19 | Notifications — Banner | Toast/push notification UI |
| 20 | Lock Screen | PIN / biometric entry |

---

## Navigation Patterns

### Checklist

- [ ] **Tab bar** — Same items, same order, same icons on all screens
- [ ] **Back button** — Consistent placement (top-left), same icon (chevron left)
- [ ] **Header title** — Consistent font size, weight, and alignment
- [ ] **Header actions** — Same visual style for secondary actions (icon buttons)
- [ ] **Modal presentation** — Same animation, same close affordance (X or swipe down)
- [ ] **Deep links** — All routes resolve to correct screens with proper back stack
- [ ] **Keyboard dismissal** — Tap-outside-dismiss on all form screens
- [ ] **Scroll position** — Preserved when navigating back to a list

### Findings

| Screen | Issue | Severity | Status |
|--------|-------|----------|--------|
| | | | |

---

## Visual Consistency

### Colors

- [ ] **Primary action color** — Same blue/teal on all CTA buttons
- [ ] **Danger color** — Same red on all destructive actions
- [ ] **Text colors** — Consistent hierarchy (primary, secondary, disabled)
- [ ] **Background colors** — Same card/list background across screens
- [ ] **Error text** — Same red shade for all validation messages
- [ ] **Success text** — Same green shade for all success states

### Typography

- [ ] **Heading font** — Same family, weight, and size across all screens
- [ ] **Body font** — Same family and size across all screens
- [ ] **Caption / helper text** — Same size and color
- [ ] **Button label** — Same font weight, case (sentence vs title case)
- [ ] **Monospace** — Consistent for addresses, keys, hashes

### Spacing

- [ ] **Screen padding** — Consistent horizontal padding (16dp / 20dp)
- [ ] **Card padding** — Same internal padding on all cards
- [ ] **List item height** — Consistent touch target (≥ 48dp)
- [ ] **Between sections** — Consistent gap (16dp / 24dp)
- [ ] **Button height** — Same height for all primary/secondary buttons

### Findings

| Screen | Issue | Severity | Status |
|--------|-------|----------|--------|
| | | | |

---

## Form Interactions

### Checklist

- [ ] **Input field styling** — Same border, radius, padding, label position
- [ ] **Focus state** — Same highlight colour and style on all inputs
- [ ] **Validation timing** — All forms validate on blur (or consistent strategy)
- [ ] **Error message placement** — Same position (below input, above helper text)
- [ ] **Character limits** — Displayed consistently (e.g., "12/30")
- [ ] **Masked input** — PIN/seed fields use same reveal pattern
- [ ] **Submit button** — Disabled until form valid, shows loading state on press
- [ ] **Double-tap prevention** — Submit button disabled after tap
- [ ] **Numeric keyboard** — Shown for amount fields
- [ ] **Autocorrect** — Disabled on sensitive fields (seed, addresses)

### Findings

| Screen | Issue | Severity | Status |
|--------|-------|----------|--------|
| | | | |

---

## Error States

### Checklist

- [ ] **Network error** — Consistent toast / inline message style
- [ ] **Timeout error** — Retry button shown with message
- [ ] **Server error** — User-friendly message (not raw JSON/status code)
- [ ] **Validation error** — Inline next to the relevant field
- [ ] **Insufficient balance** — Specific error message on Send screen
- [ ] **Wrong network** — Clear message if user is on testnet vs mainnet
- [ ] **Session expired** — Redirect to lock screen, clear sensitive data
- [ ] **Transaction failure** — Show reason (e.g., "insufficient funds", "bad sequence")
- [ ] **Camera permission** — Denied state handled gracefully (show settings link)
- [ ] **Notification permission** — Denied state handled gracefully

### Findings

| Screen | Issue | Severity | Status |
|--------|-------|----------|--------|
| | | | |

---

## Loading States

### Checklist

- [ ] **Full-screen loader** — Same spinner style and overlay on all screens
- [ ] **Inline loader** — Same skeleton/shimmer pattern on all lists
- [ ] **Button loading** — Spinner replaces text, button disabled
- [ ] **Pull-to-refresh** — Same animation and feedback on all scrollable lists
- [ ] **Splash screen** — Branded, no flash of white
- [ ] **Progress bar** — Used for multi-step processes (onboarding)
- [ ] **Minimum loading time** — Artificial delay (e.g., 300ms) if request is very fast, to avoid flicker
- [ ] **Cancellable** — Loading states allow back navigation

### Findings

| Screen | Issue | Severity | Status |
|--------|-------|----------|--------|
| | | | |

---

## Empty States

### Checklist

- [ ] **No transactions** — Illustration + message + CTA (e.g., "Receive your first payment")
- [ ] **No notifications** — Illustration + message
- [ ] **No assets** — Message with link to add assets
- [ ] **No search results** — Message with suggestion to refine query
- [ ] **Empty state style** — Same illustration style, same layout across all screens

### Findings

| Screen | Issue | Severity | Status |
|--------|-------|----------|--------|
| | | | |

---

## Accessibility

### Checklist

- [ ] **Touch targets** — All interactive elements ≥ 48×48dp
- [ ] **Colour contrast** — All text meets WCAG 2.1 AA (4.5:1 normal, 3:1 large)
- [ ] **Screen reader labels** — All icons, buttons, images have `accessibilityLabel`
- [ ] **Focus order** — Logical tab order on all form screens
- [ ] **Reduce motion** — Respects `AccessibilityInfo.isReduceMotionEnabled()` for animations
- [ ] **Font scaling** — Text scales with system font size (no hardcoded px)
- [ ] **Semantic headings** — Proper heading hierarchy (`header`, `h1`, `h2` roles)
- [ ] **Error announcements** — Screen reader announces field errors on focus
- [ ] **Success announcements** — Screen reader announces success after action
- [ ] **Modal focus trap** — Keyboard focus trapped inside modals

### Findings

| Screen | Issue | Severity | Status |
|--------|-------|----------|--------|
| | | | |

---

## Common Patterns to Verify

### Pattern: Wallet Address Display
- [ ] Truncation format consistent (e.g., `GABC…XYZ`)
- [ ] Copy icon same position and style
- [ ] Tap to copy with visual feedback (tooltip "Copied!")
- [ ] QR code same size and styling

### Pattern: Balance Display
- [ ] Same decimal formatting (e.g., always 2 or 7 decimals)
- [ ] Fiat equivalent shown consistently
- [ ] Loading skeleton for balance

### Pattern: Confirm/Submit
- [ ] Confirm screen shows all relevant details
- [ ] Fee breakdown shown before submit
- [ ] Final confirmation button is prominent and clearly labelled

### Pattern: Settings Rows
- [ ] Chevron icon for navigable rows
- [ ] Toggle switch for boolean settings
- [ ] Same row height and padding

### Pattern: Alerts & Toasts
- [ ] Success toast appears at top, auto-dismisses
- [ ] Error toast appears at top, persists until dismissed
- [ ] Warning dialog requires explicit confirmation

---

## Audit Process

1. **Prepare** — Review this checklist and the list of screens
2. **Walk through** each screen on both iOS and Android
3. **Note deviations** in the Findings tables above
4. **Assign severity** using the standard scale (Critical / Major / Minor / Trivial)
5. **File issues** in GitHub with `ux-audit` label
6. **Track remediation** — Each issue assigned to a designer/engineer
7. **Re-audit** — After fixes, repeat spot checks on critical flows

---

## Severity Definitions (UX Context)

| Severity | UX Definition | Action |
|----------|---------------|--------|
| **Critical** | User cannot complete a task, or visual inconsistency causes confusion across the entire app | Fix immediately |
| **Major** | Noticeable inconsistency that degrades the experience but does not block the task | Fix before launch |
| **Minor** | Subtle inconsistency, non-standard spacing, slight misalignment | Fix if time allows |
| **Trivial** | One-off pixel offset, very rare state | Document, fix post-launch |
