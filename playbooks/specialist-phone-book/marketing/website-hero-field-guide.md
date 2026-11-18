# Website hero field guide

The knowledge behind the [Website hero specialist](website-hero.md). It was compiled on
2026-11-17 from two web research passes. The first asked what good heroes do. The second asked
what bad heroes do and which popular rules fail. The two passes were run separately and then
cross-checked: they agreed wherever they overlapped. Read the brief first. Use this guide to
ground each judgment, and cite it by section.

**Grades.** A = peer-reviewed or large-sample study with its method shown. B = a research firm,
platform owner or standards body with a stated method (NN/g, Baymard, web.dev, HTTP Archive,
W3C, Apple, Google, Pew). C = a practitioner A/B test or case study with data shown. D = opinion,
a vendor blog, or a statistic with no traceable source. Most classic hero research was done on
desktop. **[M]** marks findings measured on phones.

**Dates matter.** Store rules, web standards, browser behavior, traffic splits and AI-referral
data change. Before quoting a number from this guide as current, check its source again. Section
12 lists those sources.

## 1. What a hero is, and isn't

- **A hero is a role, not a picture.** It's the first screen's answer to three questions: what is
  this, is it for me, and what do I do next. A text-only first screen is still a hero. The word
  reached the web through Bootstrap 2's `.hero-unit` (2012), renamed `.jumbotron` in Bootstrap 3
  and dropped in Bootstrap 5 [B]. Its ancestors are the tabloid front page and the poster: one
  story, read at a glance.
- **Hero-shaped things that aren't heroes:**
  - a mood image or video that says nothing;
  - a carousel, which is several heroes competing, and the first one wins;
  - a splash intro, cookie wall, newsletter modal or login wall in front of the content.
- **Sometimes there should be no classic hero at all.** When visitors already know the job and
  come back to do it, the first screen should be the tool: a search box, a chat input, a
  listings grid. Google, ChatGPT and Airbnb (checked 2026-11-17) open on the task. A marketing
  pitch there is only delay. For a shop with a broad catalogue, one featured promotion makes
  visitors misjudge what it sells: 42% of mobile shop homepages did this [B, Baymard 2016, M].

## 2. The hero is the second screen

The visitor's first screen was somewhere else, and their goal from it decides what they notice
on yours. People skip anything off-goal or ad-like [B, NN/g banner blindness 2018, M]. On a
weak "information scent", they leave for another option [A, theory: Pirolli & Card 1999].
Message match (continuing the promise and the picture that brought them) is well founded in
theory and in Google Ads' "landing page experience". Its measured lifts (+39% to +48%) come only
from practitioner tests [C]. Don't quote a universal number.

| Arrival | What they just saw | What the hero must do first |
|---|---|---|
| Search result | A title (Google uses the page's `<title>` about 87% of the time, otherwise often the H1) and a snippet | Confirm the snippet's promise in the H1. The H1 should work as a search result title |
| Featured snippet / People also ask | A highlighted passage; the link scrolls to it | The landing section needs its own heading, because they may never see the hero |
| AI assistant | A summary that may already describe the product | One plain, quotable sentence that confirms the facts an assistant repeats (what it is, price or "free", platform), server-rendered |
| Link from a friend | A preview card (og:title, og:image) and a note | Be fully self-explanatory and match the card. The sharer's reputation is at stake |
| Social post | The post, opened in an in-app browser: logged out, shorter viewport, no Smart App Banner, no app handoff | Hook in the first screen. Carry its own visible store link or next step |
| Ad | The ad's specific promise and picture | The same promise and the same picture, landing on the specific thing |
| App store page | Screenshots and the listing | The same icon, name and first screen, plus legitimacy cues |
| Typed URL / returning | Nothing but memory | The task entry point, with almost no pitch |

- **AI arrivals are fewer and better informed.** With a Google AI summary on the page, people
  clicked a result on 8% of visits against 15% without one [A, Pew 2025]. AI-referred retail
  visitors converted worse than other traffic through mid-2025 and better from late 2025 (+16%
  in October, +31% over the holidays) [B, Adobe]. Advice that "AI traffic is low quality" is
  out of date. This changes by the quarter.
- **Link previews are built without running JavaScript.** Apple Messages builds the preview on
  the sender's device from server-rendered Open Graph tags (Apple TN3156, known via secondary
  summaries) [B]. A card with no image, a generic title, shouting copy or a mismatched domain
  looks like the scams recipients are trained to distrust [A, Stivala & Pellegrino 2020, on
  deceptive previews; the effect on senders is inference]. Sharing serves the sharer's
  self-presentation [A, Berger 2014]. No experiment varies preview design and measures trust, so
  this area rests on the weakest evidence in the guide.

## 3. Why heroes are everywhere, and what that means

- **Web layouts converged after 2007.** Layout distance between sites fell over 30%, and
  frameworks such as Bootstrap correlated with that sameness [A, Goree et al., CHI 2021]. The
  full-width photo hero is partly a by-product of frameworks and responsive design, not proof
  that it works.
- **Prevalence has no census.** The best proxy is the Largest Contentful Paint (LCP) element. An
  image is the LCP element on 85.3% of desktop pages and 76.0% of mobile pages. Text is the LCP
  element on 23.7% of mobile pages, because hero images get shrunk or dropped on phones [B, Web
  Almanac 2025].
- **"Hero sections are dead" is opinion** [D]. Its supporting statistics couldn't be traced. The
  defensible position: the first screen must do the hero's job, and sometimes the product does
  that job better than a banner does.
- **Galleries and awards mislead.** They show screenshots, not phones, load time, copy or the
  losing variants. Awwwards gives performance no separate score [D/B]. Category-typical,
  low-complexity layouts are rated most appealing within 17–50 ms [A, Tuch et al. 2012]. So
  look like your category in layout, and stand out in what you say.
- **Famous brands' heroes are a trap for unknown products.** A household name answers "what is
  this" before the page says a word. Only 14.1% of credibility comments cited name recognition
  [A, Fogg et al. 2003]: most visitors meet most products as strangers. NN/g has asked for a
  plain tagline "especially if you're new or less than famous" since 2002 [B].

## 4. The jobs a hero does

**Functional, for the visitor:**
1. *Triage*: is this worth more of my time?
2. *Confirm*: did I land where the link promised?
3. *Understand*: what is it? Ideally the hero shows it.
4. *Cost*: what will it take from me (money, time, an account, an install, data)?
5. *Route*: what's the next step for what I came to do?

**Emotional:** feeling oriented and capable. Easy-to-process design is felt as liking and read as
beauty [A, Reber et al. 2004]. Feeling safe: "design look" was the most-cited credibility cue,
in 46.1% of comments [A, Fogg 2003]. Relief that their problem can be solved.

**Social:** "Is this for people like me?" Visual style signals the audience: large text and bright
colors read as "for children" [A, Goree 2021], and preferred color and complexity vary by age,
gender, education and country [A, Reinecke & Gajos 2014, about 40,000 people]. For the sharer:
"Can I send this without looking foolish?" The hero should fit in one sentence a sharer would
type ("it's a ___ that ___").

**The four forces** (Moesta's switching model [D as evidence, a widely used practitioner
framework]): a switch happens when push plus pull outweigh anxiety plus habit. Bad heroes spend
everything on pull and ignore the other forces.

| Force | The hero's job | Elements that do it |
|---|---|---|
| Push (they arrive with it) | Recognize it; don't invent it | A headline naming their situation in their words |
| Pull | Make the better state specific | The real product or outcome; a concrete benefit |
| Anxiety: is it legit? | Credibility at first glance | A conventional, polished frame; real people; specifics |
| Anxiety: what's the catch? | Disclose cost and commitment | "Free", the price, "no account", the platform, next to the CTA |
| Anxiety: is it for me? | Audience fit | A who-it's-for line; category-typical cues |
| Habit | Make switching cheap | Show it working now: a sample, a demo, the tool itself; no walls before value |

Ask of every element "which force does this serve?" Elements that serve none are candidates to
cut.

## 5. What visitors do in the first seconds

- **They decide fast, then commit.** The chance of leaving is highest in the first ~10 s and
  flattens after ~30 s. This is from 2 billion visits to 205,873 pages, 2009 desktop data
  [A, Liu, White & Dumais 2010]. The value proposition must land within about 10 s.
- **"50 ms" means visual appeal only.** Lindgaard 2006 had 22–40 students rate screenshots on
  desktop monitors [A, narrow]. Trust and usability gut ratings are also driven by appeal, but
  they are processed differently [A, Lindgaard 2011]. No study links a 50 ms rating to
  conversion, and nobody reads words in 50 ms.
- **Attention falls at the fold but doesn't stop there.** On desktop, 57% of viewing time is on
  the first screen and 74% on the first two (NN/g 2018, 120 people). That's down from 80% on
  the first screen in 2010 [B]. On phones, 70% of shoppers scroll nearly the whole homepage on
  arrival to "get a feel", against 25% on desktop [B, Baymard 2016, M]. Neither "nobody scrolls"
  nor "the fold is a myth" holds.
- **They read little and scan for goal words.** People read about 20% of a page's words
  [A, Weinreich 2008]. Front-load the meaning, and the headline must stand without the subhead.
- **They look at informative images and skip decoration.** Real people and products get looked
  at; stock "jazz" is ignored [B, NN/g 2010]. On phones, big standalone graphics are mistaken
  for ads [B, M]. Visitors infer what a site offers from its first images, and guess too
  narrowly [B, Baymard].
- **They read motion as advertising.** Moving content is assumed to be an ad, and motion pulls
  the eye off the headline whether people want it to or not [A, Yantis & Jonides 1984;
  B, NN/g].
- **They expect conventions** such as a logo top left, a visible menu, and buttons that look like
  buttons [A, Roth et al. 2010; B, Jakob's law]. Centered logos made going back home about 6×
  likelier to fail [B, NN/g 2016].
- **Generic CTAs mislead them.** Users who tapped "Get started" landed in quizzes and sign-ups
  without learning what the service was, and some left. They wanted a one-line explanation and
  the price first [B, NN/g 2017].
- **Phones aren't everything.** Worldwide, about 60% of page views are on phones, but the US was
  52% desktop in October 2026, and desktop converts better [B, StatCounter; Contentsquare].
  Design phone first by default, and check the site's own split.
- **Thumbs:** touch is most accurate at the center of the screen (7 mm against 12 mm at the
  corners) [B, Hoober 2017, M]. The evidence doesn't say "put everything at the bottom".

## 6. First principles

Each principle holds regardless of industry, and each one names why.

1. **Say what it is before why it's great.** A visitor triaging under a leaving hazard has to
   categorize the thing before any benefit makes sense. The biggest measured hero wins are
   clarity wins: a plain headline beat "You can't be too careful" by 330% (with other changes
   too) [C, MECLABS], and objective copy beat promotional copy for usability by 27% [B, NN/g].
   On a phone, the category belongs in the headline's first line.
2. **Continue the promise that brought them** (section 2).
3. **Be simple, and look like your kind of site.** Low complexity and category-typical layout
   read as liking and trust [A, Tuch 2012; Reber 2004]. On a phone, a layout that is clean on
   desktop can become crowded at 390 px.
4. **Have one focal point, ranked by the visitor's goal.** Competing elements split the first
   fixations. Only one thing can dominate a phone screen.
5. **Show evidence, not decoration.** Show the product, the outcome or real people; otherwise use
   no image. Doing it best is showing the product working (section 9).
6. **Legibility is persuasion.** Easier-to-read statements are judged truer [A, Reber & Schwarz
   1999, qualified by Hansen 2008]. Pages written at a grade 5–7 reading level converted at
   11.1% against 5.3% [C, Unbounce, correlational]. Text over busy images loses this.
7. **Make the next step specific and honest about its cost.** The button label is the scent for
   the next screen. A label that hides a sign-up or a fee breaks the promise.
8. **Stand still by default** (section 5, motion).
9. **Be fast and stable.** The hero is usually the LCP element, so a slow hero means a blank
   first screen during the peak leaving window. Layout shift moves the button under the thumb.
10. **Leave a door open below.** A hero that looks complete, such as a full-bleed image with
    nothing peeking below it, is a "false floor". In one test, 6 of 8 users never realized the
    page scrolled [B, NN/g 2016, n=8].
11. **Represent the whole offer.** Visitors don't look for what they believe isn't there.
12. **Earn trust in proportion to how unknown you are.** Without a known name, the surface is all
    the visitor has. Trust builds in levels: asking for an email, an account or payment before
    giving any value fails [B, NN/g hierarchy of trust].
13. **Expect small effects: fix clarity first, then test.** Of 160 hero-image A/B tests, 12% won,
    70% made no measurable difference and 18% lost [C, Mida, checked 2026-11-17]. Of well-designed
    ideas at Microsoft, about two thirds failed [A, Kohavi 2009]. Published lifts are
    survivors. A five-second test with 10–20 people finds clarity failures. Conversion effects
    need thousands of visitors.

## 7. The one-minute review

Run these on the real first screen at phone size, with the browser's bars accounted for, and at
desktop size. Stop at the first hard fail and report it.

1. **Arrival:** does the first line confirm what they saw one tap ago, and show the same thing?
2. **Five seconds:** show the screenshot at real size for 5 s. Ask, in this order: what is it,
   who is it for, what would you do next, and was anything confusing. Prime people with the
   arrival ("a friend sent you this link"). Pass: at least 80% get the category and the
   audience right. Use 5–10 people to see patterns, or about 30 to report a percentage. Ask no
   design-opinion questions [B/D, Perfetti; Doncaster 2014].
3. **Cover the logo:** is it still clear? Could a competitor paste the same headline?
4. **Krug's four questions:** what is this, what do they have, what can I do here, and why here
   rather than elsewhere [D, expert heuristic, the most widely used].
5. **The phone's first screen:** the visible area is roughly 650–770 × 360–414 CSS px, less in
   in-app browsers. The headline is whole and at most 4 lines. The primary action is visible.
   Something peeks below. Header, banners and browser bars take under 40%.
   - **No reliable published table exists.** On iOS 26, Safari's floating toolbar (about 83 px in
     one report) changes what `innerHeight`, `svh` and `dvh` report, and developers' measurements
     disagree: 659–699 px on 390-wide iPhones with the bars showing, and 754–768 px on an iPhone 16
     Pro [D, developer reports, checked 2026-11-18].
   - **Judge at the low end,** about 650 px for a 390-wide phone. A screenshot of a 390×844 window
     overstates the first screen by about 190 px. Where the decision depends on the exact line,
     ask for a screenshot from a real phone in Safari and from a link opened in Messages.
6. **Squint:** there is one focal point, and the eye's second stop is the headline or the CTA.
7. **The image:** what would be lost without it? It should be the real product, people or
   outcome, and it must not misstate the scope.
8. **The CTA label:** it says what happens next and what it costs. No bare "Get started" or
   "Learn more".
9. **Anxiety:** the price or "free", the platform, who's behind it, and any sign-up are all
   findable without scrolling.
10. **Contrast:** measure the worst spot under any text, in every crop. Body text needs at least
    4.5:1. Large text (at least 24 px, or 18.66 px bold) needs at least 3:1. Don't round
    (4.499 fails). Leave margin for sunlight. Button borders and icons need at least 3:1.
11. **Targets:** at least 24×24 CSS px (WCAG 2.5.8, AA). The primary action should be 44×44.
12. **Motion:** nothing moves on its own for more than 5 s without a pause control (WCAG 2.2.2,
    Level A). No auto-rotating carousel. Reduced-motion settings are honored. The headline isn't
    animated in.
13. **Speed:** use field data (CrUX at the 75th percentile), mobile and desktop separately. LCP
    should be at most 2.5 s, INP at most 200 ms, and CLS at most 0.1. The hero image isn't
    lazy-loaded, has `fetchpriority="high"`, sits in the HTML and has its size set. Chrome
    ignores blurry low-entropy placeholders for LCP.
14. **Semantics:** the headline is the page's single H1 and comes before the CTA in the HTML.
    Text is real text, not baked into the image. Alt text is correct, and badges have names.
15. **App heroes:** use only official badges. Apple's must be at least 40 px tall, with clear
    space of a quarter of its height, one per layout, "subordinate… so that it isn't the
    dominant artwork". It comes first and in black when other badges appear. Google Play's must
    be at least 28 px and no smaller than any other badge. Provide a Smart App Banner rather
    than an interstitial, but don't count on it as the first screen's action. Count its height in
    the first-screen budget. It shows only in Safari on devices that can run the app, so
    Android, desktop, and (reportedly) in-app browsers and Chrome on iOS never see it. Once
    dismissed, it doesn't come back [B, Apple, read 2026-11-18]. Offer a QR code or
    send-to-phone path on desktop. Device images are
    straight-on and untilted, with copy beside them, not on them. There are download and
    pre-order badges only, no "coming soon" badge [B, Apple Marketing Guidelines, Google
    Partner Marketing Hub, checked 2026-11-17].
16. **The share preview:** server-rendered og:title and og:image (usually 1200×630) that match
    the hero. Paste the link into a messaging app and look.
17. **First click,** for heroes with several routes: at least 80% of 20+ people pick the right
    route. A correct first click led to success 87% of the time, against 46% after a wrong one
    [C/B, Bailey & Wolfson 2009].

There is **no evidence-based limit on headline length** (section 10). Use the phone line budget:
at 32 px on a 390 px screen, about 18–22 characters fit per line. Then run the five-second test.

## 8. Never do

Ordered by how often each occurs times what it costs.

| # | Failure | Spot it in seconds | Cost | Fix |
|---|---|---|---|---|
| 1 | Says nothing about what it is: a slogan, pun or mood line | Cover the logo: can a stranger name the category and the outcome? | +330% clear vs clever [C]; first-10-s exits [A] | Name what it is and for whom, in plain words, front-loaded |
| 2 | Unreadable text over an image | Squint at the phone crop: does any letter sit on a busy or mid-tone patch? | 83.9% of top home pages have low-contrast text, up from 79.1% in 2025 [B, WebAIM 2026] | A solid panel or an overlay of 50% or more; on phones, text above the image |
| 3 | Bloated or lazy-loaded hero image | Is the LCP element lazy, unprioritized or multi-MB? | 16–17% of pages lazy-load their LCP image, flat since 2024 [B]; Vodafone: 31% faster LCP, +8% sales [C] | Load it eagerly, `fetchpriority`, `srcset`, modern formats, set its size |
| 4 | False floor, or the CTA below the phone's visible screen | A 100vh hero, nothing peeking, the button under the toolbar line | 6 of 8 users never scrolled [B] | Size by content or `svh`; let the next section peek |
| 5 | Auto-rotating carousel | Dots, arrows, a progress bar | About 1% clicked, 84–89% of them on slide 1 [C, Notre Dame 2013]; mis-taps [B]; 52% of mobile shops still auto-rotate [B, Baymard 2026] | One static message; other promotions as sections below |
| 6 | Overlays on arrival | Anything covering more than a thin strip | Modals rank among the most hated formats (5.82 of 7) [B]; Google's interstitial guidance [B] | A small dismissible bar; equal-weight consent; ask only after giving value |
| 7 | Layout shift | Compare shots at 0.5 s and 3 s | Yahoo! JAPAN: −0.2 CLS, +15% page views per session [C] | Sized media, reserved banner space, matched fallback fonts |
| 8 | Autoplay background video as the message | A frozen frame or play glyph; text over footage | No effect at ~27k impressions per arm [C]; blocked in iOS Low Power Mode [C]; needs a pause [B] | A still of the real product; an explainer on tap (one won +64% [C]) |
| 9 | Stock people or decoration | Smiles at laptops, gradients, handshakes | Ignored [B]; HubSpot +24% without a staff photo [C] | The real product, people or outcome, or no image |
| 10 | A wall of claims, or several equal CTAs | More than ~3 claims; 3+ same-weight buttons | "Too much text" and "busy" lead to rejection [A]; overload when choices are hard [A] | One primary action plus at most one quiet secondary; proof below |
| 11 | Fake urgency, scarcity or social proof | Countdowns, "only 2 left", live viewer counts | 42 of 399 EU shops [B]; FTC fake-review rule in force since Oct 2024; EU Digital Fairness Act proposed 2026-11-11 (not law yet) [B/D] | Only real deadlines and attributable proof |
| 12 | "Free" with a hidden catch | "Free" headline; a trial or subscription in fine print | Amazon paid $2.5B over Prime sign-up dark patterns [B, FTC 2025] | State the model in the hero or just under it |
| 13 | A wall before any value | A form or account prompt as the main element; "coming soon" with email capture only | "We rarely have seen users more annoyed" [B, NN/g on login walls] | Show the product or a sample first; capture is optional |
| 14 | Store badge or mockup misuse | Home-made, oversized, translated or tilted badges and phones; one platform with no word for the other | Breaks Apple's license and Google's rules [B]; tells other-platform visitors "not for you" | Official badges, subordinate, App Store first; real screens on straight frames |
| 15 | Looks like an ad | Boxed promo styling, flashing, an "offer" look | Banner blindness [B] | Plain type consistent with the site |
| 16 | A desktop composition squeezed onto a phone | Subject cropped out; text over a face; a 4+ line headline | Phone traffic is the majority worldwide [B] | Art-directed crops; text stacked above the image |
| 17 | Motion without a reduced-motion path | Parallax, scroll-jacking, loops behind text | WCAG 2.2.2 [B] | Honor `prefers-reduced-motion`; nothing conveyed only by motion |
| 18 | Meaning baked into the image | The headline isn't selectable text | No accessible name, no translation, invisible to search [B] | Live text |
| 19 | A share preview that looks like spam | Missing image, a generic "Home" title, a mismatched domain | Recipients are primed to distrust [A]; the sharer's reputation [inference] | og:title = the product + what it is; og:image = the real product |

## 9. Hero patterns, and when each fits

Evidence on which pattern converts better is almost entirely C/D. The "fits when" column reasons
from section 6.

| Pattern | Fits when | Main risks |
|---|---|---|
| Headline + product shot (real screens) | The default for an unknown product: a picture proves it | Screenshots unreadable on phones; pretty mockups prove little |
| Product as hero (the working tool or a playable sample in the first screen) | Value shows in one interaction with no sign-up, and the affordance is obvious or explained in one line | A stranger doesn't know what to do; script weight; screen readers. Evidence is vendor-only |
| Interactive demo or tour | Complex products, for buyers who want to see before talking | Demos captured on desktop fail on phones; weight |
| Search-first / task-first | Known brands, navigational visits, large inventory | Tells newcomers nothing |
| Name + tagline + product photo | Household brands and launches | For unknowns, communicates nothing |
| Typographic statement | Non-visual products; text LCP is cheap | Generic statements; ignored art |
| Social-proof-led | Anxiety is the main barrier and the proof is specific | On phones it pushes the promise off screen: a review strip under the hero cost −16.7% on 92%-mobile cold traffic [C] |
| Offer-led | Aware or returning visitors, campaigns | Newcomers misread the scope; disclose renewal next to the CTA |
| Illustration or mascot-led | Abstract products, character brands | Shows nothing of the product; no general photo-vs-illustration answer [C, Mida] |
| App landing hero | Mobile apps: promise, real app screens, badges, QR on desktop | Tilted 3D phones break Apple's rules; no Smart App Banner in in-app browsers |
| Message-carrying video, click to play | Products best understood in motion | Few press play (0.9% of homepage views at HubSpot [C]) |
| Audience router (two or three doors) | Two-sided markets, distinct audiences | Each message gets half the space |
| Source-matched variants | Paid campaigns, partner referrals | Drifts from the version search engines index |
| Decorative background video, rotating carousel | Almost never | Sections 5 and 8 |

**By how known the product is:** household brands can use task-first, name-plus-tagline or
offer-led heroes. Unknown products should default to headline + product shot, or product as
hero when the tool explains itself, plus one specific proof.

**On phones:** side-by-side layouts stack, so decide which comes first; the default is words,
then a cropped visual peeking above the fold line. Logo strips shrink to one line. Inputs need a
font of at least 16 px to stop iOS zooming in.

## 10. Myths and claims checked

| Claim | Verdict |
|---|---|
| "You have 50 ms" | Partly holds: it covers visual appeal only, not understanding, trust in the offer or leaving [A, narrow] |
| "Users leave in 10–20 s" | Holds as a hazard curve: the risk peaks in the first 10 s [A] |
| "8-second attention span, worse than a goldfish" | Untraceable; BBC *More or Less* found no study [D] |
| "80% of attention is above the fold" | Out of date: it's 57% (2018, desktop) [B] |
| "Nobody scrolls" / "the fold is a myth" | Both fail [B] |
| F-pattern / Z-pattern as layout recipes | F is a symptom of unformatted text [B]. Z has no eye-tracking evidence [D] |
| "Faces raise conversion" | Conditional: the famous wins were a full redesign (Highrise) and a click metric (Medalia), and losses exist [C] |
| "Video lifts conversion 80%" | Traces to a 2010 vendor's best case with no method [D] |
| "One CTA beats several (+371%)" | The number is untraceable. Choice overload averages zero but appears when choices are hard and preferences unsure, which describes cold visitors, so one clear primary still wins [A] |
| "Benefits beat features" | Untraceable as a rule. Category clarity is what's robust [D] |
| "Shorter headlines perform better" | No evidence [D/C] |
| "Social proof belongs in the hero" | Mixed: wins and losses; 19.4% of 170 tests lost [C] |
| "53% leave after 3 s" | Correlational 2016 data from opted-in sites [D for causal use] |
| "0.1 s faster = +8.4% conversions" | Correlational and Google-commissioned [C] |
| "94% of first impressions are design" / "75% judge credibility by design" | Misreadings: the 94% is the share of comments about rejecting sites from 15 women, and the 75% is really 46.1% of comments [A narrow / D popular] |
| "Put the CTA in the bottom thumb zone" | Partly: touch is most accurate at the center [B] |
| "The hero should fill the screen (100vh)" | No evidence, and risky: false floors, and the toolbar hides the bottom [B] |

## 11. Open questions

- **First impressions and behavior:** does first-glance appeal change behavior? No study links it
  to conversion.
- **Attention on phones:** no large eye-tracking study of attention on phones exists.
- **Product as hero vs a picture of it:** only vendor data, with no controls.
- **Faces, illustration vs photo, video:** results point both ways, and no rule survives.
- **Proof placement on phones:** proof reduces anxiety but can push the promise off screen.
- **Primary + quiet secondary CTA:** no controlled test.
- **Pre-launch "coming soon" heroes and email capture:** no public data. Theory argues against
  capture-only heroes.
- **Preview cards and the sharer's trust:** no experiment.
- **`svh` vs `dvh` for hero height:** no UX data.

## 12. Sources to recheck before quoting

- **Store rules:** [Apple Marketing Guidelines](https://developer.apple.com/app-store/marketing/guidelines/);
  [Google Play badges](https://partnermarketinghub.withgoogle.com/brands/google-play/google-play/lockups-icons-badges/);
  [Apple Smart App Banners](https://developer.apple.com/documentation/webkit/promoting-apps-with-smart-app-banners);
  [Apple TN3156 link previews](https://developer.apple.com/documentation/technotes/tn3156-create-rich-previews-for-messages).
- **Standards and speed:** [web.dev LCP](https://web.dev/articles/lcp) and Core Web Vitals;
  [WCAG 2.2 Understanding](https://www.w3.org/WAI/WCAG22/Understanding/);
  [Web Almanac 2025](https://almanac.httparchive.org/en/2025/performance);
  [WebAIM Million](https://webaim.org/projects/million/);
  [Google on intrusive interstitials](https://developers.google.com/search/docs/appearance/avoid-intrusive-interstitials);
  viewport units (`svh`, `dvh`) on MDN.
- **Traffic and devices:** [StatCounter](https://gs.statcounter.com/platform-market-share/desktop-mobile/), and the
  site's own analytics.
- **Research:** NN/g on [scrolling and attention](https://www.nngroup.com/articles/scrolling-and-attention/),
  [how long users stay](https://www.nngroup.com/articles/how-long-do-users-stay-on-web-pages/),
  [photos as content](https://www.nngroup.com/articles/photos-as-web-content/),
  [the illusion of completeness](https://www.nngroup.com/articles/illusion-of-completeness/),
  [homepage design principles](https://www.nngroup.com/articles/homepage-design-principles/),
  [auto-forwarding carousels](https://www.nngroup.com/articles/auto-forwarding/),
  [text over images](https://www.nngroup.com/articles/text-over-images/),
  [commitment levels](https://www.nngroup.com/articles/commitment-levels/);
  [Baymard mobile homepages](https://baymard.com/research-articles/mobile-homepage-usability);
  [Tuch et al. 2012](https://research.google/pubs/the-role-of-visual-complexity-and-prototypicality-regarding-first-impression-of-websites-working-towards-understanding-aesthetic-judgments/);
  Lindgaard et al. 2006 (*Behaviour & IT* 25(2)) and 2011 (*ACM TOCHI* 18(1));
  Liu, White & Dumais, SIGIR 2010; Fogg et al., DUX 2003; Goree et al., CHI 2021;
  Reinecke & Gajos, CHI 2014; [Erik Runyon's carousel data](https://erikrunyon.com/2013/01/carousel-interaction-stats/);
  [Mida hero-image tests](http://mida.so/change-types/hero-image).
- **AI referrals:** [Pew 2025](https://www.pewresearch.org/short-reads/2025/07/22/google-users-are-less-likely-to-click-on-links-when-an-ai-summary-appears-in-the-results/);
  Adobe Analytics reports (these change by the quarter).
- **Dark patterns:** [FTC, Bringing Dark Patterns to Light](https://www.ftc.gov/reports/bringing-dark-patterns-light);
  the FTC Consumer Reviews and Testimonials Rule (16 CFR 465); the EU Digital Fairness Act (a
  proposal since 2026-11-11: check its status).
