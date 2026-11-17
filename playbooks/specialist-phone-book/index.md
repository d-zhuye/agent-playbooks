# Specialist phone book

Specialists you can call for a spot-check, a review, a critique, a question or a recommendation.
Each line says what that specialist catches, and links to their full brief. Each area starts
with its generalist, for a broad pass; call the specialists below it for depth.

## How to call a specialist

1. **Check for project specialists.** If [projects/](projects/README.md) has a folder named
   after the project's folder, read its index too: it lists specialists only that project needs
   and project additions to the briefs below.
2. **Pick the fewest who cover the task,** usually one to three. Choose a generalist for a broad
   first pass and a specialist for a narrow question. Say which ones you picked and why.
3. **Get them what they need to see.** Each brief's "What you need to see" says what that
   specialist must inspect: screenshots at real size, the running app, the full diff. Gather it
   or say where it is. A visual specialist given only code can't do the job.
4. **Start one subagent per specialist,** so their points of view stay separate. Give each this
   prompt, with this folder's absolute path filled in:

   ```text
   You are the <specialist> from the specialist phone book.
   First read <this folder>/how-specialists-work.md, then your brief: <this folder>/<area>/<file>.md
   (and the project's addition to it, if there is one).
   Project: <absolute path>. Look at: <files, screens, pages or question>.
   To see it: <screenshot paths, the command that renders it, or the tools you can use>.
   This feeds: <the decision it helps make>. Out of scope: <what to leave alone>.
   ```

5. **For a quick spot-check,** you can skip the subagent: read both files, take the role
   yourself, and say which specialist you are speaking as.
6. **When several report,** merge their findings into one list, most important first. Where two
   specialists want opposite things, pick one and say why. Pass these to the owner as the
   specialists wrote them, without settling them yourself: disagreements with the project's
   decisions (with their reasoning and strength), and anything a specialist couldn't see (with
   their proposed workaround).

## Product and strategy

- **[Product manager](product/product-manager.md)** (generalist): whether a feature solves a real problem for real users, its scope, and what to cut.
- [Positioning strategist](product/positioning.md): one clear promise, different from rivals, aimed at the right people.
- [Pricing and monetization specialist](product/pricing.md): the line between free and paid, prices, paywall timing, feeling tricked.
- [Onboarding and activation specialist](product/onboarding.md): how fast a new user gets to the moment the product pays off.
- [Retention specialist](product/retention.md): why people come back or drift away, without manipulative tricks.
- [Digital wellbeing specialist](product/digital-wellbeing.md): healthy use: natural stopping points, no compulsion loops, honest claims to parents, screen time.
- [Prioritization coach](product/prioritization.md): which ideas to do first, weighing value against cost.
- [Competitive analyst](product/competitive-analyst.md): what rivals do better, what they miss, and where the gap is.

## Visual design

- **[Designer](design/designer.md)** (generalist): overall visual quality, and which specialist a "looks off" problem needs.
- [Mobile-first designer](design/mobile-first.md): small screens, thumb reach, touch targets, safe areas, the keyboard.
- [Typography specialist](design/typography.md): type choice, sizes, line length, line height, weights, legibility.
- [Spacing and rhythm specialist](design/spacing.md): a consistent spacing scale, grouping by distance, cramped edges.
- [Visual hierarchy specialist](design/hierarchy.md): what the eye sees first, second, third, and whether that's what matters.
- [Color and contrast specialist](design/color-and-contrast.md): palette roles, contrast ratios, meaning carried by color alone, dark mode.
- [Layout and grid specialist](design/layout.md): alignment, grids, and how screens reflow across sizes and real content.
- [Iconography specialist](design/iconography.md): whether icons read at a glance, stay consistent, and need a label.
- [Illustration and character designer](design/illustration.md): style consistency, appeal, silhouettes, and art that supports the screen.
- [Motion designer](design/motion.md): what each animation is for, its timing and easing, and reduced-motion settings.
- [Design systems specialist](design/design-systems.md): reusable components and tokens, and screens drifting from them.
- [Brand designer](design/brand.md): whether everything looks and feels like the same product.

## UX and interaction

- **[UX designer](ux/ux-designer.md)** (generalist): whether people can do what they came to do without confusion.
- [Information architect](ux/information-architecture.md): how things are grouped, named and found.
- [Interaction designer](ux/interaction.md): taps, gestures, feedback, and states such as pressed, loading and disabled.
- [Navigation specialist](ux/navigation.md): where you are, how you got there, and how you get back.
- [Forms and input specialist](ux/forms.md): fields, keyboards, validation and error messages.
- [Edge states specialist](ux/edge-states.md): empty, full, offline, slow and failed screens.
- [Usability evaluator](ux/usability.md): the friction a first-time user hits, found by walking the flow.
- [Tutorial designer](ux/tutorial-design.md): teaching a product or game by doing, at the moment it's needed, instead of up front.
- [Ethical design reviewer](ux/ethical-design.md): designs that trick, pressure or trap people.

## How it feels to the user

Each of these specialists takes the user's side on one feeling, judged against a sentence the
user would say. They walk everything the user goes through (the store page, first use, everyday
use, paying, something going wrong, leaving), find the moments that build or break that feeling,
and hand each fix to the specialist whose craft it is. They say which user they mean, and keep
what users actually said apart from what a user would probably feel.

- **[User advocate](advocates/user-advocate.md)** (generalist): walks the whole product as the user and says which feelings are at risk, and where.
- [Trust advocate](advocates/trust.md): "I can believe what it says, and it does what it promised."
- [Ease advocate](advocates/ease.md): "I can relax. Nothing here rushes me, trips me up or embarrasses me."
- [Safety advocate](advocates/safety.md): "I won't be harmed, exploited or taken advantage of, by the product or by other people."
- [Understanding advocate](advocates/understanding.md): "It gets what I need and what matters to me."
- [Control advocate](advocates/control.md): "I decide, and I can change my mind or leave."
- [Competence advocate](advocates/competence.md): "I can do this, and it doesn't make me feel stupid."
- [Respect advocate](advocates/respect.md): "It values my time, attention and money."
- [Belonging advocate](advocates/belonging.md): "People like me are welcome here."

## Writing and content

- **[Editor](writing/editor.md)** (generalist): whether any text is clear, accurate and consistent.
- [UX writer](writing/ux-writer.md): buttons, prompts, errors and short in-app text that help people act.
- [Copy editor](writing/copy-editor.md): grammar, spelling, punctuation, and one style for terms and names.
- [Plain-language editor](writing/plain-language.md): short words, short sentences, reading level, jargon.
- [Conversion copywriter](writing/copywriter.md): store, landing page and ad copy that makes people want it, truthfully.
- [Brand voice specialist](writing/brand-voice.md): whether all text sounds like the same intended voice.
- [Technical writer](writing/technical-writer.md): docs, READMEs and guides people can follow step by step.
- [Localization-readiness reviewer](writing/localization.md): text that will translate: idioms, length, plurals, dates.
- [Cultural consultant](writing/cultural-consultant.md): content that confuses or offends outside one culture: holidays, food, family, gestures, one-country knowledge.
- [Fact checker](writing/fact-checker.md): every claim true, current and traceable to a source.

## Storytelling and narrative

Specific characters' personas and rules live in each project's folder under
[projects/](projects/README.md), not in these briefs.

- **[Narrative designer](story/narrative-designer.md)** (generalist): how story, characters and voice carry through a product, and where story helps play or gets in its way.
- [Character writer](story/character-writer.md): personalities that stay consistent and likable across every line, animation and screen.
- [Humor writer](story/humor-writer.md): jokes that land with the intended group, aren't mean, don't repeat, and work read aloud.

## Games and play

- **[Game designer](games/game-designer.md)** (generalist): whether a game is fun: goals, choices, pacing, tension.
- [Game-rules editor](games/rules-editor.md): rules a new group can learn in one read, with no gaps to argue over.
- [Party game designer](games/party-games.md): group play: turn-taking, waiting time, social risk, laughs.
- [Game balance specialist](games/balance.md): fairness, difficulty curves, and strategies that always win.
- [Puzzle and trivia editor](games/puzzle-and-trivia.md): one right answer, fair clues, and a spread of difficulty.
- [Playtest designer](games/playtest.md): how to run a playtest and what to watch for.
- [Family play specialist](games/family-play.md): mixed ages playing together: reading level, attention, fairness.
- [Social dynamics specialist](games/social-dynamics.md): how prompts land in a group: embarrassment, exclusion, safety.
- [Mental health safety reviewer](games/mental-health-safety.md): prompts that could touch a raw nerve (grief, trauma, self-harm, body image), and how to soften or flag them.

## Accessibility

- **[Accessibility specialist](accessibility/accessibility.md)** (generalist): whether everyone can use it, across sight, hearing, movement and thinking.
- [Screen reader specialist](accessibility/screen-reader.md): VoiceOver and TalkBack labels, reading order, grouping, announcements.
- [Low vision specialist](accessibility/low-vision.md): larger text settings, zoom, contrast, and layouts at the largest sizes.
- [Motor and touch specialist](accessibility/motor-and-touch.md): target sizes, gesture alternatives, time limits.
- [Cognitive accessibility specialist](accessibility/cognitive.md): memory load, clear steps, reading level, time pressure.
- [Color vision specialist](accessibility/color-vision.md): meaning carried by color alone, checked in color-blind simulations.
- [Hearing specialist](accessibility/hearing.md): sound-only cues, captions, and haptics as a backup.

## Engineering

- **[Software engineer](engineering/software-engineer.md)** (generalist): sound, maintainable code that does what it should.
- [Code reviewer](engineering/code-reviewer.md): bugs, missing tests, risky changes and confusing code in a diff.
- [Software architect](engineering/architect.md): module boundaries, dependencies, and where code belongs.
- [Refactoring specialist](engineering/refactoring.md): simpler code with the same behavior.
- [Debugging specialist](engineering/debugging.md): root causes, not symptoms.
- [Performance specialist](engineering/performance.md): slow screens, dropped frames, memory, battery, startup, bundle size.
- [Security specialist](engineering/security.md): secrets, input handling, storage, and what an attacker could reach.
- [API designer](engineering/api-design.md): interfaces that are easy to use right and hard to use wrong.
- [Data and storage specialist](engineering/data-and-storage.md): saved data, migrations, offline use, and data loss.
- [Dependency specialist](engineering/dependencies.md): library choices, versions, upgrades and supply-chain risk.

## Platforms

- [iOS specialist](platforms/ios.md): Apple conventions, APIs and the Human Interface Guidelines.
- [Android specialist](platforms/android.md): Android conventions, Material Design, device variety, the back gesture.
- [React Native and Expo specialist](platforms/react-native-expo.md): cross-platform traps, native modules, Expo workflows.
- [Web front-end specialist](platforms/web-front-end.md): HTML, CSS, browsers, responsive pages, page speed.
- [Backend and cloud specialist](platforms/backend-cloud.md): servers, APIs, hosting and running costs.
- [Build and release engineer](platforms/build-and-release.md): CI, signing, versioning and release checklists.

## Quality and testing

- **[QA lead](quality/qa-lead.md)** (generalist): whether it's ready to ship: risks, coverage, and what to test by hand.
- [Test strategist](quality/test-strategy.md): which tests to write at which level, and which to skip.
- [Exploratory tester](quality/exploratory-testing.md): odd inputs, interruptions and wrong orders that break things.
- [Device and compatibility tester](quality/device-compatibility.md): small screens, old OS versions, slow devices, other languages.
- [Regression hunter](quality/regression.md): what this change could have broken somewhere else.

## Marketing and growth

- **[Marketer](marketing/marketer.md)** (generalist): who it's for, what makes them want it, and where to reach them.
- [App store optimization specialist](marketing/aso.md): store name, subtitle, keywords and listing text for search.
- [Regional market specialist](marketing/regional-markets.md): what changes by country: listing language, prices, rivals, search terms, local norms.
- [Store creative specialist](marketing/store-creative.md): screenshots, icon and preview video that win the tap.
- [SEO specialist](marketing/seo.md): web pages that rank for what people search.
- [Landing page specialist](marketing/landing-pages.md): pages that turn visitors into downloads or sign-ups.
- [Launch planner](marketing/launch.md): launch steps, channels and timing, in order.
- [Press kit writer](marketing/press-kit.md): the press page, fact sheet, images and pitch a journalist needs to cover the product.
- [Social and community specialist](marketing/social-community.md): posts, communities and word of mouth.
- [Influencer outreach specialist](marketing/influencer-outreach.md): creators who fit the audience, how to pitch them, and the rules on disclosing paid posts.
- [Analytics and experiment specialist](marketing/analytics-experiments.md): what to measure, A/B tests, reading results honestly.

## Research

- **[Researcher](research/researcher.md)** (generalist): what's true about users, and how sure we can be.
- [User interviewer](research/user-interviews.md): interview guides, questions that don't lead, reading what people say.
- [Jobs-to-be-done analyst](research/jobs-to-be-done.md): the struggle that sends people looking, and what holds them back.
- [Survey designer](research/surveys.md): fair questions and samples that mean something.
- [Data analyst](research/data-analyst.md): numbers turned into findings, and misleading charts or stats caught.
- [Desk researcher](research/desk-research.md): published sources found, checked and cited.

## Behavior and psychology

These specialists check that a finding has held up, and how big its effect is, before leaning on
it. They send pressure tactics to the ethical design reviewer: their advice must still work if
people understood what it was doing.

- **[Behavioral scientist](behavior/behavioral-scientist.md)** (generalist): why people act as they do, and which behavioral finding fits the problem.
- [Motivation psychologist](behavior/motivation.md): what makes people start, keep going and come back: autonomy, competence, belonging, inner and outer rewards.
- [Consumer psychologist](behavior/consumer-psychology.md): how people judge value, trust and risk before they buy or download.
- [Decision-making psychologist](behavior/decision-making.md): attention, memory, too many choices, shortcuts and biases at the moment of choosing.
- [Social psychologist](behavior/social-psychology.md): group behavior, social proof, conformity, status and belonging.
- [Behavioral economist](behavior/behavioral-economics.md): defaults, framing, anchoring, loss aversion, and how prices and choices are presented.

## Legal, privacy and policy

These specialists find gaps and say when a lawyer is needed. They don't give legal advice.

- **[Policy and compliance specialist](policy/policy-compliance.md)** (generalist): the rules a product must follow, and when to ask a lawyer.
- [Privacy specialist](policy/privacy.md): what data is collected and sent, and whether policy, store labels and consent match.
- [App Store review specialist](policy/app-store-review.md): Apple's App Review Guidelines and what gets rejected.
- [Google Play policy specialist](policy/google-play-policy.md): Play policies, the Data safety form, target API rules.
- [Children's compliance specialist](policy/childrens-compliance.md): children's privacy laws, kids categories and age ratings.
- [Licensing specialist](policy/licensing.md): open-source licenses, fonts, images, music and credits.
- [Trademark and IP specialist](policy/trademark-ip.md): names, logos, and work too close to someone else's.
- [Consumer protection specialist](policy/consumer-protection.md): subscriptions, refunds, price display, claims in ads.

## Sound and media

- [Sound designer](sound/sound-designer.md): sounds that give feedback and set the mood without annoying.
- [Music specialist](sound/music.md): music choice, loops and licensing.
- [Haptics designer](sound/haptics.md): vibrations that mean something.
- [Video editor](sound/video.md): app previews, trailers and short videos.
- [Voice and speech specialist](sound/voice-and-speech.md): text-to-speech, voice-over, pronunciation.

## Business and operations

- **[Business advisor](business/business-advisor.md)** (generalist): whether the numbers work and what the business needs next.
- [Finance specialist](business/finance.md): revenue, costs, store fees, break-even.
- [Customer support specialist](business/customer-support.md): help pages, replies, and the questions users will ask.
- [Operations specialist](business/operations.md): processes, tools and recurring chores.

## AI and agent work

- **[Agent workflow designer](ai/agent-workflow.md)** (generalist): how agents, skills and people split the work.
- [Prompt engineer](ai/prompt-engineer.md): prompts that get reliable output.
- [Writer for agents](ai/writing-for-agents.md): instructions, skills and AGENTS.md files agents follow correctly.
- [Eval designer](ai/evals.md): tests that show whether an AI output or agent setup is good.
- [AI cost specialist](ai/ai-cost.md): token use, model choice, and cheaper ways to the same result.
- [AI content reviewer](ai/ai-content-review.md): made-up facts, bias and off-tone output in generated content.

## Challengers

Points of view rather than fields. Useful on plans and decisions as well as finished work.

- [Devil's advocate](challengers/devils-advocate.md): the strongest case against the plan.
- [Pre-mortem facilitator](challengers/pre-mortem.md): imagines it failed and works out why.
- [Simplifier](challengers/simplifier.md): what can be cut while the value stays.
- [Fresh eyes](challengers/fresh-eyes.md): a first look with no context: what confuses.
- [Skeptical user](challengers/skeptical-user.md): what looks too good, vague or staged.
- [Ethicist](challengers/ethicist.md): who could be harmed, left out or misled.

## Project specialists

Specialists only one project needs (stand-ins for its audience, an editor for its own kind of
content, character sheets) live in [projects/](projects/README.md), one folder per project.

- [While We Wait](projects/while-we-wait/index.md): character sheets, additions, and the general
  specialists it calls most.
