# App Store release decisions need stakeholder and user-choice context

- Seen: 2026-11-13, agent-playbooks; conversation about preparing an application for App Store release.
- What happened: Discussing what users, developers and Apple want raised questions about how to choose listing metadata, screenshots and release information. A stakeholder ranking alone did not explain which users to attract, why they would choose this app, or what evidence the listing should provide.
- Tried: Examined the original ranking, reciprocal benefits, competing interests, user alternatives and the implications for release assets → produced the questions and decision framework below; no application was evaluated or listing tested.
- Status: open

## Intent and use

Read this entry when preparing an application's App Store release. It preserves the questions,
thoughts and insights from the conversation as guidance for an agent crafting metadata,
screenshots and App Store information. It is a synthesis, not a verbatim transcript or a proven
release playbook.

Aim for informed choices by suitable users, a sustainable developer business and a trustworthy,
useful marketplace for Apple. Seek changes that benefit all three; where interests conflict,
make the trade-off explicit. There is no assumption that every stakeholder's preferences can be
maximized simultaneously.

Inspect the actual application and existing research before drafting. Distinguish observed
facts, the owner's decisions and untested hypotheses. Verify Apple's current requirements at
release time; the conversation is not the authority for field limits, search behavior or policy.

## The original thought and its refinement

The owner's starting hypothesis was that serving users offers the greatest leverage because it
also serves developers and Apple, followed by serving Apple, with developer needs last. The
discussion retained user value as a strong starting point and questioned a permanent ranking:

- Benefits are reciprocal. Users provide demand, purchases, feedback and recommendations.
  Developers provide useful software. Apple provides tools, distribution and infrastructure.
- Benefits do not pass through automatically. An app can delight users without earning enough
  to maintain it. A change that increases Apple's returns can leave less for developers without
  improving user value.
- Creating value and capturing enough of it to continue are separate problems. Developer
  sustainability supports continued user benefit.
- Importance, bargaining power and the next implementation priority are different questions.
  A platform can depend on developers collectively while an individual developer has little
  negotiating power. The next useful improvement depends on what currently limits success.

Economically, users and developers are the two sides of the platform; Apple operates it. All
three are stakeholders, with different roles and influence.

| Stakeholder | Conditions for continued participation | Common preferences and possible tensions |
|---|---|---|
| Users | Relevant, reliable apps; safety; understandable commitments | Convenience, choice, privacy, low costs and continued support; these can conflict with one another or with sustainable development. |
| Developers | A workable way to build, reach users and maintain the app; predictable distribution conditions | Visibility, income, autonomy, good tools and lower costs; visibility and monetization must still match user benefit. |
| Apple | A trusted, economically sustainable platform that attracts both sides | Revenue, retention, distinctive device experiences and influence over distribution; these are not identical to every user's or developer's preferences. |

These are analytical descriptions, not a claim that everyone in a group wants the same thing.
The person using an app may also differ from the person paying for it.

## The biggest missing question: what would the user do instead?

A need explains why an app might be useful. The user's next-best alternative helps explain why
they might choose this app. Alternatives include another app, a built-in tool, a manual routine
and doing nothing. Account for price, learning effort, migration, habits and uncertainty when
considering whether an advantage is sufficient to prompt a change.

Write and test this hypothesis before polishing release assets:

> For **[specific user]** facing **[specific situation]**, our app makes **[desired outcome]**
> easier than **[current alternative]**, because **[credible, meaningful difference]**.

Use evidence to fill the blanks. A broad category such as "people who want to be productive"
does not settle which promise, words or screenshots will matter. A claim of differentiation
must hold against the alternatives that user actually considers.

## Questions to answer for the application

1. **Which users can this app serve exceptionally well?** Identify the situation, abilities and
   constraints that matter, who pays, and who is unlikely to be a good fit.
2. **What makes them look for help now?** Find the triggering event, frustration or new
   responsibility, and the language they use to describe it.
3. **What do they use today, and why would they change?** Identify their next-best alternative,
   the meaningful advantage, switching effort and any sacrifice the app asks them to make.
4. **What uncertainty blocks the decision?** Investigate fit, ease of use, reliability, privacy,
   payment commitments and other concerns. Decide what visible evidence would resolve each.
5. **Where do they encounter the listing, and what do they already know?** Search, a referral
   and an external campaign can create different needs for explanation and proof. Consider
   language and region as well.
6. **What must happen after installation for the promise to become true?** Define the first
   meaningful success and the setup, permissions or purchases required to reach it.
7. **Where do stakeholder interests align or diverge in this decision?** Examine relevance,
   pricing, discovery, review and distribution constraints without assuming that more downloads
   or revenue automatically benefits everyone.
8. **What evidence would change the proposed positioning?** Separate research from inference;
   ask users to interpret the listing and compare alternatives, then examine whether the
   resulting expectations are fulfilled in use.

## Implications for metadata and App Store information

The listing supports a decision: relevance, expected benefit, credibility and commitment. Give
each element a job, keep the combined message coherent, and use language the intended audience
understands. Apple's discovery systems and review requirements shape how the message can be
distributed; developer goals determine which users and outcomes the business can sustain.

| Element | Decision it should support | Guidance for the agent |
|---|---|---|
| App name / title | What is this, and what should I remember? | Balance a distinctive identity with recognizable purpose. The balance depends on brand familiarity. |
| Subtitle | Why might this suit my situation? | Add a meaningful outcome, audience or distinction. Make it complement the name rather than spend space repeating it. |
| Keywords | Can people seeking this kind of help find it? | Research relevant search language. Check current rules on length, duplication and prohibited terms; popularity alone does not establish fit. |
| Categories | Where would someone reasonably look for this app? | Classify by the actual experience and intended use. |
| Icon | Can I recognize the app and understand its character? | Keep identity consistent and inspect legibility at its displayed size. |
| Description | What will I get, how does it help, and what must I commit to? | Lead with relevant value, explain how it is delivered, and make material requirements, limitations and paid functionality understandable. |
| Promotional text | What timely information would help me decide? | Use it for relevant news or offers under current rules; verify which fields affect search rather than assuming all text does. |
| Screenshots and optional previews | What evidence shows the experience will suit me? | Demonstrate the promise through the actual app, realistic content and understandable workflows. |
| Privacy details and age rating | Is this appropriate for my data preferences and intended users? | Derive answers from actual app and SDK behavior, content and capabilities. Resolve unknowns rather than guessing. |
| Pricing and in-app purchases | What access or ongoing commitment am I choosing? | Explain the business model and distinguish advertised paid capabilities from what is available without additional payment. |
| Support, privacy policy and other required links | Where can I find help and understand the terms? | Check that the destinations work, describe this app accurately and agree with the release configuration. |
| What's New | What changed that matters to me? | Describe real changes appropriate to the version. |
| Review information | Can Apple assess the submitted experience? | Explain non-obvious flows and provide the review access and details currently required for this release. |

Do not treat examples from the conversation as approved copy for a real app. Its hypothetical
planner used a brand plus category in the title, a complementary benefit in the subtitle and
screenshots demonstrating planning and adjustment. The lesson is how those elements support
one claim; the application needs its own evidence and wording.

## Screenshot questions and sequence

Start with a proposed sequence, then test whether intended users understand it:

1. **Outcome:** show the core useful result in a realistic situation.
2. **Mechanism:** show how the user reaches that result.
3. **Fit or distinction:** demonstrate why this experience suits the intended situation.
4. **Remaining decision questions:** show relevant capabilities or constraints that still need
   explanation, such as supported integrations, accessibility or offline use, if present.

This is a starting hypothesis, not a mandatory order or screenshot count. Prioritize the
opening images, which may also appear in discovery surfaces; verify current display behavior.
Aim for one understandable claim per image with visible evidence. Check captions and interface
details at the size people will actually see, including each supported localization.

Show the app in use with representative sample data. Keep depicted features and outcomes
consistent with the release build, make paid access clear where required, and avoid presenting
an unusually elaborate setup as an effortless new-user experience. Confirm Apple's current
rules for screenshots, overlays, previews and any separate creative asset types.

## What a release-preparation agent should produce

Scale the work to existing evidence. Reuse current research and assets; do not launch a full
research project merely to fill every question in this entry.

1. **A short decision brief:** intended user and situation, next-best alternative, meaningful
   advantage, first successful use, business model and unresolved assumptions. Record material
   trade-offs among the stakeholders.
2. **Metadata drafts:** the proposed fields and localizations, their measured lengths under
   Apple's current counting rules, and concise rationale tied to user language and product
   evidence. Flag conflicts with existing brand or copy decisions for review.
3. **A screenshot storyboard and prepared assets:** for each image, its user question, caption,
   exact app scene and sample data, supporting feature evidence, and any access limitation.
   Review captures from the release candidate at the required sizes.
4. **An App Store information check:** categories, privacy details, age rating, pricing,
   purchases, links, version information and reviewer access agree with the actual release.
   Record missing information plainly.
5. **A validation proposal:** test a concrete communication hypothesis, with enough traffic for
   a meaningful result. Apple's Product Page Optimization can compare screenshots, icons and
   previews; check its current supported assets and eligibility. Separately examine whether
   acquired users reach the promised outcome, return and support the business. A download
   increase alone does not establish joint benefit.

Keep release copy in the application's established source of truth. This journal holds the
reasoning and questions, not a second copy of an app's live listing or a claim of release approval.

## Related playbooks

- [Customer story research](../playbooks/customer-story-research/README.md): a possible way to
  investigate situations, alternatives and user language when direct evidence is missing; its
  own status is unproven, and public stories do not replace real user research.
- [Pre-launch search research](../playbooks/pre-launch-search-research.md): investigates how
  people search and grounds proposed listing terms in recorded evidence. This entry adds the
  stakeholder and user-choice reasoning for interpreting that evidence and designing assets.
- [App Store upload readiness](../playbooks/app-store-upload-readiness.md): checks the build
  and upload requirements. A sound listing does not establish binary or upload readiness.

## Sources discussed in the conversation

These are starting points to reopen during release preparation, not frozen policy requirements:

- [Apple: creating your product page](https://developer.apple.com/app-store/product-page/).
- [Apple: App Store search](https://developer.apple.com/app-store/search/).
- [Apple: App Review Guidelines, especially accurate metadata](https://developer.apple.com/app-store/review/guidelines/#accurate-metadata).
- [Apple: Product Page Optimization](https://developer.apple.com/app-store/product-page-optimization/).
- [Apple: Developer Program](https://developer.apple.com/programs/).
- [Rochet and Tirole: Platform Competition in Two-Sided Markets](https://doi.org/10.1162/154247603322493212), background for the reciprocal platform relationships.
