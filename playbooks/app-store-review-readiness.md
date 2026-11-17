# App Store review readiness

An agent takes the role of an App Store reviewer and reviews the whole submission before Apple
does: the app, the product page, the purchases and the review notes. It runs 34 fixed checks,
then sweeps every numbered App Review Guideline, and reports what would get the app rejected,
with evidence. For iOS apps; nothing in it depends on the framework.

**Adopt it when** the project is about to submit a new app or a version for App Review: always
before the first submission, and before any version that adds a purchase, an account, a
permission, an SDK that sends data, or a new kind of content.

**Status: unproven.** Written from Apple's published guidance (guidelines last updated
2026-10-16). No project has run it yet, so there are no cost figures. The first notes will show
where it needs fixing.

---

## 1. Why use it

A rejection costs a fix, often a new build, and another wait for review. Apple says over 40% of
unresolved review issues fall under guideline 2.1, App Completeness: crashes, placeholder
content, broken links, missing review information. Those are all things an agent can find
first.

Without a list, an agent asked "will Apple approve this?" checks what comes to mind and answers
as the developer: it knows why each odd thing is the way it is, so it explains the odd things
away. A reviewer knows none of that. This playbook fixes the role, the order of work and the
list, so every submission gets the same review.

[App Store upload readiness](app-store-upload-readiness.md) covers whether the upload goes
through. This one covers whether review approves it. Run both.

---

## 2. How it works

### The role

You are the **reviewer**. A reviewer gets four things: the build on a real device, the product
page, the purchase records, and the review notes. A reviewer never sees the code, the design
docs or the team's reasons. Whatever those four things don't show or explain doesn't exist.

- Look for the reason to reject. The developer's job is to remove it afterwards.
- Run it in a fresh session, not the session that built the feature.
- Judge the current build and the current text. An earlier review is not evidence.
- A check passes only on evidence you gathered in this run: a file and line, a URL and its
  response, a screen you reached, a command's output. With no evidence the result is
  **can't check**, never pass.

### Results

| Result | Meaning |
|---|---|
| **pass** | Evidence shows the reviewer finds nothing. |
| **fail** | A reviewer who notices this rejects the app. Name the guideline. |
| **risk** | It depends on the reviewer's judgment. Say what would lower the risk. |
| **can't check** | The evidence is outside the repo (App Store Connect, a real device). It goes to the owner as an exact question or a device step. |
| **n/a** | The app profile (step 3) shows the rule doesn't apply. Give the reason. |

### The seven steps

Do them in order. Each ends on its own "done when".

**Step 1. Read the current rules.** Fetch these every run, never from memory:

- <https://developer.apple.com/app-store/review/guidelines/> (long: keep fetching until you
  reach "After You Submit"; record the "Last Updated" date)
- <https://developer.apple.com/distribute/app-review/> (Apple's own list of common rejections)
- <https://developer.apple.com/help/app-review/before-submitting-for-review/complete-review>
  (what the review notes must contain)
- <https://developer.apple.com/news/upcoming-requirements/> and <https://developer.apple.com/news/>
  for rule changes newer than the guidelines' date

Done when you hold the full list of numbered guidelines, sections 1 to 5, and its date. If the
date is newer than the one at the top of this playbook, read what changed and leave a note.

**Step 2. Cold read: lay out the submission as the reviewer gets it.** Before reading any code,
collect everything Apple will receive, using the table below. Then write an **expectations
list**: every claim the product page and review notes make (each feature, number, price,
audience, "free", "no ads", "works offline"), one line each. Step 4 tests each one.

| What Apple receives | Where to find it |
|---|---|
| Name, subtitle, description, promotional text, keywords, What's New | The repo's listing file. TODO(project): path |
| Screenshots and previews | The repo's release screenshots. TODO(project): path |
| Category, age rating answers, content rights answer | Listing file, or owner |
| App Privacy answers and privacy policy URL | Listing file, or owner |
| Support and marketing URLs | Listing file |
| Review notes, contact details, demo account, attachments | The repo's reviewer notes. TODO(project): path |
| Each in-app purchase: name, description, price, review screenshot, review note | Reviewer notes, or owner |
| Price, availability by country, release option | Owner |
| The build: version, build number, devices supported | Config and the last store build |

Done when every row has its text or file in front of you, or is marked **can't check** with the
question for the owner, and the expectations list is written.

**Step 3. Profile the app from the code.** Answer each question yes or no, with evidence. The
answers decide which checks and guidelines apply.

1. Accounts or sign-in? Any third-party or social login?
2. Content made by users, or contact between users?
3. Purchases: one-time, consumable, subscription? Physical goods? Any link or mention of
   buying outside the app?
4. Ads?
5. Which SDKs and services send data off the device (analytics, crash reports, purchases,
   ads, AI, fonts, maps)? List each with what it sends.
6. Tracking across other companies' apps or sites?
7. Which permissions does it ask for (camera, photos, microphone, location, contacts,
   notifications, motion, Bluetooth, local network)?
8. Audience: aimed at children? In the Kids Category? Content for mixed ages?
9. Bundled content: any alcohol, drugs, sex, violence, gambling, horror, crude humor, medical
   topics, religion, dares or risky acts?
10. Other people's property: brand names, characters, music, sounds, fonts, photos, quotes,
    celebrity names, another game's name or rules text?
11. Web views, remote content, over-the-air updates, remote config or feature flags?
12. A regulated field: health, finance, gambling, contests, crypto, VPN?
13. Devices and orientations. Does it need a network or a backend?
14. System features: push, widgets, background modes, Siri, HealthKit, HomeKit, Apple Pay,
    extensions, keyboards?
15. Generative AI features, or personal data sent to a third-party AI?
16. Is it a game? Which countries will it be sold in?

Done when all 16 have an answer and evidence.

**Step 4. Walk the app as the reviewer.** Use the build the best way the project allows: a
device, a simulator, a web preview, or screen-by-screen through the navigation code. Follow the
review notes exactly as written, as someone who has never seen the app.

- Fresh install, first launch, onboarding, then every screen and every button.
- Every link that leaves the app, and every URL in the listing: open each and read the page.
- Reach each purchase using only the review notes. Buy, then restore.
- Deny each permission. Turn the network off. Rotate. Use the smallest and largest device the
  app supports, and iPad.
- Test every line of the expectations list from step 2.

What you can't do yourself (a real device, a sandbox purchase) becomes a numbered **device
script** for the owner, each step with what they should see.

Done when every screen in the navigation code was reached or read, every outbound URL was
opened, and every expectation is marked true or false.

**Step 5. Run the 34 checks** in section 3. Done when each has a result and evidence.

**Step 6. Sweep the guidelines.** Go through the list from step 1, one numbered guideline at a
time, 1.1 to the end of section 5. Each gets a result. A whole block can be **n/a** on one
line when the profile rules it out ("2.4.5 Mac App Store: iOS only"). The checks in section 3
cover the common rejections; the sweep catches the uncommon ones and anything Apple added
since this playbook was written.

Done when every numbered guideline on the fetched page appears in the sweep table.

**Step 7. Report** in the format in section 6. Fix nothing during the review; fixes come after
the owner has read the report.

---

## 3. The 34 checks

Guideline numbers are from the 2026-10-16 text. Apple renumbers: confirm each against the page
you fetched in step 1 and cite that.

### Completeness (2.1)

1. **Nothing unfinished.** No placeholder text or images, "coming soon", lorem ipsum, TODO,
   sample data, test labels, empty screens or buttons that do nothing. Search the strings and
   assets, then confirm on the walk.
2. **No crash or dead end on a reviewer's path.** Fresh install, first launch, each supported
   device family, network off, permissions denied. The project's tests and type checks pass on
   the commit being submitted.
3. **Every link works.** Support URL, privacy policy URL, marketing URL, and every link, email
   address and share target inside the app. Each returns the right page, and the page is about
   this app.
4. **Services are live.** The release build points at production services that will stay up
   through review. No staging hosts, test keys or expiring demo data. n/a for apps with no
   backend.
5. **The build matches the listing.** The build going to review contains every feature the
   listing and screenshots show. Compare the build's commit with the feature list; a store
   build made before the last feature merged fails here.

### Review information (2.1, 2.3.1)

6. **The review notes are complete.** They cover what Apple's "complete review" page asks for:
   what the app is and its business model, purpose and audience, devices and OS versions
   tested, external services it relies on, regional differences or "none", and where to find
   anything non-obvious. Contact name, phone and email are current.
7. **Every purchase can be found from the notes alone.** Step-by-step path to each purchase
   and to anything locked, unusual or easy to miss.
8. **Sign-in works for the reviewer.** A demo account that works on submission day, or a full
   demo mode; one account per role; any login code given in the notes. n/a without accounts.
9. **No hidden features.** Nothing dormant, flag-gated, date-gated or reachable by a secret
   gesture. Debug menus are out of the release build. Remote config and over-the-air updates
   can't turn on something the reviewer didn't see.
10. **Required documents are attached.** Licences or permission letters when the profile shows
    a regulated field or prominent third-party property. n/a otherwise.

### Product page (2.3)

11. **Every claim is true in this build.** Each line of the expectations list holds: features,
    counts, "free", "no ads", "offline". Counts in the listing match a count taken from the
    code or data today.
12. **Paid things are marked as paid.** Where the description, screenshots or previews show
    something that needs a purchase, they say so (2.3.2).
13. **Screenshots show this build in use.** Taken from the current build, right device for
    each size, mostly the app itself and not title art or a login screen. Overlay text doesn't
    promise more than the screen shows (2.3.3).
14. **Name, subtitle and keywords are clean.** No other apps' or brands' names, no prices, no
    "best" or "#1", no words unrelated to the app, name within the length limit (2.3.7).
15. **No other platforms.** No mention or image of Android, Google Play or other stores in the
    listing, screenshots or app (2.3.10).
16. **The whole product page suits all ages.** Icon, screenshots, previews and text fit the
    lowest age rating even when the app is rated higher (2.3.8). An app outside the Kids
    Category doesn't say "for kids" or "for children".
17. **Category and age rating match the content.** Answer Apple's age rating questions from
    the worst content in the app, paid content included, using profile answers 8 and 9. Compare
    with the answers on file (2.3.5, 2.3.6).

### Payments (3.1, 2.1(b))

18. **Digital goods use in-app purchase only.** Nothing unlocks by licence key, code, QR or an
    outside payment. Links or mentions of buying elsewhere follow the storefront rules in
    3.1.1(a) and 3.1.3 as fetched.
19. **Each purchase is complete and works.** Product details come from StoreKit, not
    hard-coded prices. Buying unlocks what was promised, at once, and it survives a restart.
    A visible Restore Purchases control exists and works after a reinstall.
20. **Each purchase is ready in App Store Connect.** It has a name, description, price, review
    screenshot and review note, is attached to this version, and the Paid Apps Agreement, tax
    and banking are active. An app's first in-app purchase must be submitted together with an
    app version. Usually **can't check**: ask the owner.
21. **Subscriptions say what the user gets.** Before the purchase button: name, length, price,
    what's included, and working links to the terms of use and the privacy policy; the same
    links in the listing (3.1.2). n/a without subscriptions.
22. **No forced or bought favors.** No custom "rate us" prompt (use the system review API), no
    reward for ratings, and nothing paid-for is held back until the user rates, shares, allows
    tracking or turns on notifications (5.6.1, 3.2.2, 4.5.4).

### Privacy (5.1)

23. **The privacy policy is reachable and true.** Linked in the listing and inside the app. It
    names what is collected, how, each use, each third party, how long it's kept, and how to
    ask for deletion. Compare it line by line with profile answer 5.
24. **The App Privacy answers match what leaves the device.** Every SDK in profile answer 5 is
    accounted for. "Data Not Collected" holds only if nothing is sent off the device and kept
    by the developer or a partner.
25. **Permissions are asked well.** Each purpose string says specifically why, ideally with an
    example. The prompt appears when the feature is used, the app still works when the answer
    is no, and no usage key is declared for a permission the app never asks for (5.1.1).
26. **Tracking asks first.** If profile answer 6 is yes, the tracking prompt appears before any
    tracking and the app works after "Ask App Not to Track" (5.1.2). n/a otherwise.
27. **Accounts are optional and deletable.** Features that don't need an account work without
    one. An account created in the app can be deleted in the app (5.1.1(v)). Third-party
    sign-in comes with an equivalent privacy-keeping option (4.8). n/a without accounts.
28. **Children's rules are met.** In the Kids Category or aimed mainly at children: no
    third-party ads or analytics beyond what 1.3 allows, and a parental gate before links out
    and purchases (1.3, 5.1.4). n/a otherwise.

### Content and safety (1)

29. **All bundled content was read against section 1.** For content-heavy apps read all of
    it, not a sample: search every deck, list and string table for slurs, sexual content,
    drugs, heavy drinking, gambling, violence, real people, religion and dares that could hurt
    someone (1.1, 1.4). Each hit is either fine at the app's age rating or a finding.
30. **User content is moderated.** Filtering, a report button, blocking, and published contact
    details (1.2). n/a without user content.
31. **Users can reach the developer.** A working contact route in the app and on the support
    page (1.5).

### Design and originality (4, 2.4, 2.5)

32. **It is its own app.** Name, icon and look can't be mistaken for another app's. No other
    product's name, logo or trade dress in the app or listing. More than a wrapped website,
    and useful beyond a first try (4.1, 4.2, 4.3).
33. **It behaves like an iOS app.** Layout respects safe areas on every supported device and
    on iPad. Text is readable. System buttons and gestures do what they normally do. Push is
    optional. Background modes are ones the app uses. No downloaded code that changes features
    (2.4, 2.5, 4.5.4).

### Rights (5.2)

34. **Every asset has a known source.** Fonts, images, sounds, music, icons and quoted text
    are original, licensed or public domain, and the licence is on file in the repo. No Apple
    emoji used as artwork, no Apple product pictures outside Apple's marketing rules, nothing
    that implies Apple endorses the app (5.2, 4.5.6).

### Owner questions

These are never visible from a repo. Put each in the report's owner list unless a dated record
in the repo already answers it.

- Agreements, tax and banking are active, and the Paid Apps Agreement is in effect.
- Trader status is verified, if the app will be sold in the EU.
- Age rating questions, App Privacy answers, content rights and export compliance are
  answered in App Store Connect and match the repo's record.
- Each in-app purchase is "Ready to Submit" and selected on the version page.
- The countries selected. Some have their own rules (for example, games in mainland China
  need an approval number): look up Apple's current regional requirements for each kind of
  app, and leave a country out if its rule isn't met.
- The release option. Manual release lets the owner pick the day after approval.

---

## 4. Setup checklist

- Nothing to install. The agent needs web access for step 1.
- Decide where the report lives. TODO(project): for example
  `docs/release/app-review-readiness.md`, replaced on each run, so the next run and the owner
  can see what changed.
- The repo should keep the listing text, reviewer notes and final screenshots in files. If
  they exist only in App Store Connect, most of step 2 becomes owner questions; ask the owner
  to export or paste them first.

---

## 5. Agent rule

Paste into `AGENTS.md`:

```md
## Before submitting for App Review

Before a version is submitted for App Review, or when asked whether Apple will approve the app,
follow <path to this playbook, or a copy in the repo>. Take the reviewer's role, in a fresh
session. Fetch Apple's current guidelines every time. Pass a check only on evidence gathered in
that run. Report in the playbook's format, and fix nothing until the owner has read it.
```

- *Reviewer's role, fresh session*: the session that built a feature knows the reasons behind
  it and explains problems away.
- *Fetch every time*: Apple revises the guidelines several times a year.
- *Evidence from that run*: listings and screenshots drift from the app between reviews.
- *Fix nothing first*: a fix made mid-review changes what the later checks see, and the owner
  loses the list of what was wrong.

---

## 6. Report format

```md
# App Review readiness: <app> <version> (<build>), <date>

Guidelines read: last updated <date on Apple's page>.

**Verdict: ready to submit | fix first | waiting on owner checks.** <one sentence>

## Would be rejected
1. **<guideline number and name>: <what the reviewer sees>.**
   Evidence: <file:line, URL, or screen>. Fix: <one sentence>.

## Could be rejected
1. **<guideline>: <what the reviewer might object to>.** Evidence: <…>. Lower the risk by: <…>.

## Owner checks
- [ ] <exact place in App Store Connect>: <what it must say or show>

## Device script
1. <step> → <what you should see>

## Checks
1) **Nothing unfinished: pass.** <one sentence of evidence>
…
34) **Every asset has a known source: risk.** <…>

## Guideline sweep
| Guideline | Result | Evidence or reason |
|---|---|---|
```

Findings come first, worst first, so the owner can stop reading after the lists. The verdict is
"ready to submit" only when there is no fail and no open owner check. Risks don't block; the
owner decides each one.

---

## 7. Acceptance test

1. Ask "would Apple approve this?" without naming the playbook. The agent fetches the
   guidelines, runs all seven steps, and reports in the section 6 format with a guideline date.
2. Add a screen that says "Coming soon". Check 1 fails and names the screen.
3. Change the privacy policy URL to one that returns 404. Check 3 fails.
4. Add a feature to the description that the app doesn't have. Check 11 fails and quotes the
   line.
5. Remove the Restore Purchases control. Check 19 fails.

---

## 8. Gotchas

None from a full run yet. From the projects this was written beside:

- **Listings drift.** After a new feature shipped, one listing gave a count in one place and
  described a different number in another, and the screenshots predated the feature. This is
  why check 11 takes counts from the code on the day, and check 13 dates the screenshots
  against the build.
- **The store build can be older than the code.** A downloaded store build turned out to
  predate two native modules. Check 5 compares the build's commit, not the working tree.
- **Text and screenshots can be fixed without a new build.** A finding in the listing, review
  notes or purchase records costs minutes; a finding in the binary costs a build. Say which
  kind each finding is, so the owner can order the fixes.
- **If Apple rejects anyway,** add a note with the guideline number and what the reviewer
  wrote. That is how this list learns.

---

## 9. What it does not cover

- A promise of approval. Reviewers use judgment, and a "risk" can go either way.
- Whether the upload is accepted: see [App Store upload readiness](app-store-upload-readiness.md).
- Whether the listing persuades anyone: see
  [Pre-launch search research](pre-launch-search-research.md).
- Legal advice on licences, privacy law or regional rules. The playbook finds the question;
  the owner gets the answer.
- Google Play. Its review has its own policies (data safety form, target audience, payments).
- macOS, tvOS, watchOS and visionOS specifics. The sweep reaches their guidelines, but the 34
  checks were written for iPhone and iPad.

---

## 10. Builds on

- [App Store upload readiness](app-store-upload-readiness.md): run it alongside. Its checks
  on usage strings, privacy manifest and devices feed checks 24, 25 and 33 here.
- Apple's own pages listed in step 1. This playbook adds the reviewer's role, an order of
  work, evidence rules, and a report an owner can act on.
