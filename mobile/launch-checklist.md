# Launch Readiness Checklist

> **Status Key:** ✅ Done | 🔄 In Progress | ❌ Not Started | 🚫 Blocked | N/A Not Applicable

---

## 1. Systems Operational

- [ ] **Mobile app builds successfully** — iOS (Release) and Android (Release/APK)
- [ ] **App starts without crash** on fresh install
- [ ] **App starts without crash** on upgrade from previous version
- [ ] **All major flows functional**: registration, login, wallet creation, transaction, settings
- [ ] **Authentication flow** works (biometric, PIN, wallet seed)
- [ ] **Background/foreground lifecycle** handles correctly
- [ ] **Deep links** resolve to correct screens
- [ ] **Push notifications** received and actionable
- [ ] **Offline mode** displays appropriate UI and syncs when reconnected
- [ ] **Logout / account reset** clears local data securely

## 2. Third-Party Integrations Verified

- [ ] **Stellar testnet** — All contract interactions functional
- [ ] **Stellar mainnet** — All contract interactions functional
- [ ] **Horizon API** — Responses within acceptable latency (< 2s P95)
- [ ] **Expo services** — OTA updates, push notifications configured
- [ ] **Analytics SDK** — Events firing correctly
- [ ] **Crash reporting** (Sentry / similar) — Captures and groups errors
- [ ] **WalletConnect** — Pairing and signing flows tested
- [ ] **Asset price feeds** — Data current and accurate
- [ ] **External API keys** — Rotated post-launch if applicable

## 3. Rollback Plan Documented

- [ ] **Release versioning** — Semantic versioning scheme documented
- [ ] **Expo publish rollback** — Steps to revert OTA update
- [ ] **App Store rollback** — Process to push previous binary via App Store Connect / Google Play Console
- [ ] **Smart contract rollback** — Upgrade/emergency pause mechanism documented
- [ ] **Database / state rollback** — Migration reversal steps
- [ ] **Feature flags** — Kill switch for new features
- [ ] **Communication plan** — Template for notifying users of rollback
- [ ] **Rollback tested** — Dry run completed in staging

## 4. Monitoring in Place

- [ ] **Performance monitoring** — `monitoringService.ts` running in production build
- [ ] **Crash reporting** — Configured and sending to dashboard
- [ ] **Custom dashboards** — Screen load times, API latency, error rates
- [ ] **Alerts configured** — PagerDuty / Slack for critical thresholds
- [ ] **Log retention policy** — Defined and implemented
- [ ] **Health endpoint** — Server-side health check operational
- [ ] **Synthetic monitoring** — Critical user journeys automated

## 5. Security Review Completed

- [ ] **Private keys never logged** — Audited all `console.log` / `logger` calls
- [ ] **Secure storage** — Wallet seeds use `expo-secure-store`
- [ ] **Certificate pinning** — Configured for API endpoints
- [ ] **Input validation** — All user inputs sanitized
- [ ] **Network traffic** — HTTPS enforced, no plaintext
- [ ] **Dependency audit** — `npm audit` / `yarn audit` shows no critical vulnerabilities
- [ ] **Permissions review** — Only required permissions requested
- [ ] **Data retention** — Personal data minimised and documented
- [ ] **Penetration test** — Completed (or scheduled)
- [ ] **Security headers** — CSP, HSTS configured on backend

## 6. Performance Benchmarks Met

- [ ] **App cold start** — < 3s on reference device (iPhone 14 / Pixel 7)
- [ ] **Screen transitions** — < 500ms P95
- [ ] **List scroll** — 60 FPS with 50+ items
- [ ] **API response** — < 2s P95 for Horizon endpoints
- [ ] **Transaction submission** — < 10s end-to-end
- [ ] **Memory usage** — < 200MB steady state
- [ ] **App size** — iOS < 100MB, Android < 80MB
- [ ] **Battery impact** — < 5% per hour of active use
- [ ] **Background sync** — Does not cause noticeable drain

## 7. App Store Metadata Ready

### iOS (App Store Connect)
- [ ] **App name** — Finalised and unique
- [ ] **Subtitle** — 30 characters max
- [ ] **Description** — 4000 characters max, keyword-optimised
- [ ] **Keywords** — Comma-separated list
- [ ] **Screenshots** — 6.7" (iPhone 14 Pro Max) and 5.5" (iPhone 8 Plus)
- [ ] **App Preview video** — Optional but recommended
- [ ] **Promotional Text** — Up to 170 characters
- [ ] **Privacy Policy URL** — Live and accessible
- [ ] **Support URL** — Live and monitored
- [ ] **Marketing URL** — Optional
- [ ] **Content Rights** — Verified all third-party content licensed
- [ ] **Age Rating** — Set correctly
- [ ] **Compliance** — Export compliance documented (EAR/ECC)
- [ ] **TestFlight** — Beta testers onboarded and feedback incorporated

### Android (Google Play Console)
- [ ] **App name** — Finalised and unique
- [ ] **Short description** — 80 characters max
- [ ] **Full description** — 4000 characters max
- [ ] **Screenshots** — Minimum 2 (8 recommended) for phone, 7" tablet, 10" tablet
- [ ] **Feature Graphic** — 1024×500px
- [ ] **Promo Video** — Optional YouTube link
- [ ] **Privacy Policy** — Same as iOS, linked
- [ ] **App Category** — Set correctly
- [ ] **Tags** — Relevant tags applied
- [ ] **Content Rating** — Questionnaire completed
- [ ] **Target audience** — Set (all ages / adults only)
- [ ] **Pricing & Distribution** — Free or paid, all countries or selected
- [ ] **In-app products** — If any, set up and tested
- [ ] **Managed publishing** — Release rolled out in staged rollout (e.g., 10% → 50% → 100%)

## 8. Legal / Compliance Reviewed

- [ ] **Terms of Service** — Updated and linked in app
- [ ] **Privacy Policy** — Updated with data practices, third-party sharing
- [ ] **GDPR compliance** — Consent flow implemented, data export/delete available
- [ ] **CCPA compliance** — Opt-out mechanism for data sale
- [ ] **App Store age rating** — Matches actual app content
- [ ] **Cryptography declaration** — Submitted to US / EU if required
- [ ] **Open source licenses** — All dependencies' licenses compatible
- [ ] **Trademark review** — App name, logo, branding cleared
- [ ] **Accessibility compliance** — WCAG 2.1 AA standards met
- [ ] **Localization** — Strings extracted, translations verified

---

## Sign-off

| Role | Name | Signed | Date |
|------|------|--------|------|
| Product Manager | | | |
| Engineering Lead | | | |
| QA Lead | | | |
| Security Lead | | | |
| Design Lead | | | |
| Legal / Compliance | | | |
| VP Engineering | | | |

---

## Launch Day Runbook

1. Final staging deployment verification (all checklist items ✅)
2. Submit to App Store / Google Play for review
3. Notify team in #launch channel
4. Monitor dashboards for first 2 hours post-approval
5. Announce on social media / blog
6. Monitor crash and error rates for 24 hours
7. Post-launch retrospective in 1 week
