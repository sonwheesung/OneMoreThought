<!--
Management note (not published).
- 🔴 DRAFT (2026-10-09 · decision #37). Not yet confirmed by the user. English is the canonical text; PRIVACY.ko.md is the formal PIPA version (not a literal translation).
- Planned URL: https://vivace-games.com/onemorethought/privacy. The web copy lives in the volleyball repo (server/app/<path>/privacy/page.tsx), as for siblings mission and Re:Read. This session does not edit that repo.
- {{APP_NAME}} = store listing name (open decision N). {{BUSINESS_*}} placeholders are filled in the web copy from common/BUSINESS_INFO.md (§1.3 passport spelling for the representative; business address only). This repo is public, so the values are not copied here.
- Must say the same thing as the in-app accessibility disclosure (locales disclosure.*), Play Data safety and docs/release/PLAY_CONSOLE.md.
- Retention = 1 year after last access (decision #40, 2026-10-09). TODO: the server purge job does not exist yet — build it before production.
- Age = birth-year check on first launch; under 14 the App sends nothing to any server (decision #41, 2026-10-09). The year is never stored or sent; only the pass/under-14 result stays on the device.
- Sensitive info in messages (decision #24 trade-off): ask users not to write it, no intent to collect, no inference, deletion on request (§1 "What you write in messages"). Closed with a default on 2026-10-09.
- The "remind if not opened" notification is not in the build yet (decision #37). The intro and the Usage Access line only say "if you use that rule". Put it back in the intro when it ships.
-->
# {{APP_NAME}} Privacy Policy

Effective date: {{EFFECTIVE_DATE}}

{{BUSINESS_NAME_EN}} (Google Play developer name: Vivace Games Studio, "we") explains here what {{APP_NAME}} ("the App") collects and why.

**The App asks you once, in your own words, before you open an app you chose.** There is no sign-up or login. The App shows no ads, does not collect the advertising ID, and does not sell personal information. The App is sold as a paid app on Google Play; Google handles payment and we never receive your payment details.

## 1. What we collect

| Category | Data | Required? | How |
|---|---|---|---|
| Pseudonymous device ID | A random number and token our common server issues to this installation | Required | Issued automatically on first launch |
| Rules | Rule type, name, on/off, days, start/end time, package names of the apps you chose, **the message you wrote (verbatim)**, re-ask interval, when you changed it and what it said before | Required to use the App | When you create or edit a rule |
| Prompt records | When a prompt was shown, target app package name, result (cancel / open / dismissed), time to decide, time zone, date | Required to use the App | Queued on the device, uploaded when online |
| Check records (only if you use "remind if not opened" rules) | Whether the chosen app was opened that day, first open time, when we notified you and what you tapped, time zone | Required to use the App | Decided on the device at the check time |
| Device info | Manufacturer, model, Android version, app version, language, time zone, whether Advanced Protection is on, first/last seen | Required to use the App | When you open the App |
| Diagnostics summary | Once a day: counts of error signals by type, device info, number of rules, counts of prompts/cancels/opens/dismissals, check results, per-target-app statistics by package name | Optional (Settings → Send diagnostics summary; on by default) | Sent automatically once a day |
| Support requests | Your message, reply e-mail, and diagnostics attached when you write to us (the summary above, recent on-device diagnostic lines, your rule messages, and previous device IDs if you erased this device) | Optional (only when you contact us) | Sent only when you send it; you see what will be sent first |
| Network info | IP address | Automatic | Part of every internet request (processed transiently by the host; we do not store it) |

### What the Accessibility and Usage Access permissions see

- **Accessibility** (only for "ask before opening" rules): reads **only the package name** of the app that comes to the foreground. It does not and cannot read screen content, what you type, passwords or notification content. The App never controls other apps through it.
- **Usage access** (only for "remind if not opened" rules): at the check time it looks only at whether **the one app in that rule** was opened that day. It does not collect usage time or the usage of any other app.
- The only app names sent to our server are the apps you put in your rules.

### What we do not collect

Screen content or typed text, usage of apps that are not in your rules, advertising ID, precise location, contacts, photos, payment information, name, phone number or account information (there is no login), and your birth year (see section 7).

### What you write in messages

Rule messages are free text, so we cannot filter them in advance. **Please do not write sensitive information such as health, body, religion or political views, or anyone else's personal information, in your messages.** We do not intend to collect such information and we do not analyse messages to infer sensitive information about you. Messages are used only for the purposes in section 2. If you wrote something sensitive, edit or delete the message in the rule and ask us to delete the server copy (section 5).

## 2. Why we use it

- To provide the feature: store your rules, detect when a chosen app opens, show the prompt and the reminder.
- To keep your records: our server holds the original; the device keeps only a small copy so the App works offline.
- To improve the service and produce statistics: which messages lead to "cancel", whether people keep using the App. Never for advertising or tracking.
- To find silent, device-specific failures (for example, a prompt that did not appear).
- To answer support requests.

## 3. How long we keep it

| Data | Retention |
|---|---|
| Rules, prompt and check records, device info on our server | **1 year** after your last use (including the messages in your rules), or deleted promptly on request |
| Diagnostics summary | **90 days** |
| Diagnostics attached to a support request | **1 year** |
| Support request text | **3 years** (Korean e-commerce consumer protection law) |
| Copies on the device | Until you uninstall the App or use Settings → Erase on this device only |

## 4. Sharing and processors

We do not sell personal information or share it for advertising. We use these processors:

| Processor | What for | Where |
|---|---|---|
| Supabase, Inc. | Database for this App and for our common server (device IDs, diagnostics, support requests) | Seoul region |
| Vercel Inc. | Hosting the App's server and our common server | United States (the App's server runs in the Seoul region) |
| Discord Inc. | An operator alert the first time a severe error signal appears in a day: signal name, model, Android version, app version | United States |
| Expo, Inc. | Delivering app code updates: platform, runtime version, update channel and a random per-install token (no rules or records) | United States |
| Google LLC | Sale and payment of the paid app on Google Play. We never receive payment details | United States |

## 5. Your rights

- You can ask to access, correct or delete your data, or to stop processing, at support@vivace-games.com. We act within 10 days.
- Because there is no login, we find your data by the pseudonymous device ID. Please include it with your request.
- **Settings → Erase on this device only** removes only the copy on this phone; the server copy stays. To delete the server copy too, contact us. After erasing, the App gets a new device ID and keeps the previous one on the device so you can still request deletion. The age question (section 7) is asked again.
- Because there is no login, if you uninstall the App or change phones you cannot get your rules and records back.

## 6. Security

All traffic is encrypted with HTTPS. Only a dedicated database account for this App can read this App's data, and row-level security is enabled. You are identified by a random pseudonymous ID, not by your name or e-mail.

## 7. Children

- **We do not collect personal information from children under 14.**
- On first launch the App asks for your birth year. It is used only to decide whether you are 14 or older; the year itself is not stored on the device or sent anywhere. Only the result stays on the device.
- If you are under 14, the App works **on this device only**: it does not get a device ID and sends no rules, records, device info or diagnostics to our servers.
- Because there is no login, age is based only on the birth year you enter. If we learn that we have collected personal information from a child under 14, we delete it promptly. A parent or guardian can ask for deletion at support@vivace-games.com.
- The App is not currently distributed in the EEA, the United Kingdom or Switzerland.

## 8. Changes

We announce changes on this page and in the App 7 days before they take effect (30 days for significant changes).

## Contact

{{BUSINESS_NAME_EN}} · Google Play developer name Vivace Games Studio · {{BUSINESS_ADDRESS_EN}} · support@vivace-games.com
