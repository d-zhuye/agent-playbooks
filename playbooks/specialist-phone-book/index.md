# Specialist phone book

Specialists you can call for a spot-check, a review, a critique, a question or a recommendation.
Each line says what that specialist catches. A linked name has a full brief; the others don't
yet. Each area starts with its generalist, for a broad pass; call the specialists below it for
depth.

## How to call a specialist

1. **Pick the fewest who cover the task,** usually one to three. Choose a generalist for a broad
   first pass and a specialist for a narrow question. Say which ones you picked and why.
2. **Start one subagent per specialist,** so their points of view stay separate. Give each this
   prompt, with this folder's absolute path filled in:

   ```text
   You are the <specialist> from the specialist phone book.
   First read <this folder>/how-specialists-work.md, then your brief: <this folder>/<area>/<file>.md.
   Project: <absolute path>. Look at: <files, screens, pages or question>.
   This feeds: <the decision it helps make>. Out of scope: <what to leave alone>.
   ```

   If the specialist has no brief yet, replace the brief with their line from this index and
   tell them the brief is missing.
3. **For a quick spot-check,** you can skip the subagent: read both files, take the role
   yourself, and say which specialist you are speaking as.
4. **When several report,** merge their findings into one list, most important first. Where two
   specialists want opposite things, pick one and say why.

## Product and strategy

- **Product manager** (generalist): whether a feature solves a real problem for real users, its scope, and what to cut. *(no brief yet)*
- Positioning strategist: one clear promise, different from rivals, aimed at the right people. *(no brief yet)*
- Pricing and monetization specialist: the line between free and paid, prices, paywall timing, feeling tricked. *(no brief yet)*
- Onboarding and activation specialist: how fast a new user gets to the moment the product pays off. *(no brief yet)*
- Retention specialist: why people come back or drift away, without manipulative tricks. *(no brief yet)*
- Prioritization coach: which ideas to do first, weighing value against cost. *(no brief yet)*
- Competitive analyst: what rivals do better, what they miss, and where the gap is. *(no brief yet)*

## Visual design

- **[Designer](design/designer.md)** (generalist): overall visual quality, and which specialist a "looks off" problem needs.
- [Mobile-first designer](design/mobile-first.md): small screens, thumb reach, touch targets, safe areas, the keyboard.
- [Typography specialist](design/typography.md): type choice, sizes, line length, line height, weights, legibility.
- [Spacing and rhythm specialist](design/spacing.md): a consistent spacing scale, grouping by distance, cramped edges.
- [Visual hierarchy specialist](design/hierarchy.md): what the eye sees first, second, third, and whether that's what matters.
- [Color and contrast specialist](design/color-and-contrast.md): palette roles, contrast ratios, meaning carried by color alone, dark mode.
- [Layout and grid specialist](design/layout.md): alignment, grids, and how screens reflow across sizes and real content.
- Iconography specialist: whether icons read at a glance, stay consistent, and need a label. *(no brief yet)*
- Illustration and character designer: style consistency, appeal, silhouettes, and art that supports the screen. *(no brief yet)*
- Motion designer: what each animation is for, its timing and easing, and reduced-motion settings. *(no brief yet)*
- Design systems specialist: reusable components and tokens, and screens drifting from them. *(no brief yet)*
- Brand designer: whether everything looks and feels like the same product. *(no brief yet)*

## UX and interaction

- **UX designer** (generalist): whether people can do what they came to do without confusion. *(no brief yet)*
- Information architect: how things are grouped, named and found. *(no brief yet)*
- Interaction designer: taps, gestures, feedback, and states such as pressed, loading and disabled. *(no brief yet)*
- Navigation specialist: where you are, how you got there, and how you get back. *(no brief yet)*
- Forms and input specialist: fields, keyboards, validation and error messages. *(no brief yet)*
- Edge states specialist: empty, full, offline, slow and failed screens. *(no brief yet)*
- Usability evaluator: the friction a first-time user hits, found by walking the flow. *(no brief yet)*
- Ethical design reviewer: designs that trick, pressure or trap people. *(no brief yet)*

## Writing and content

- **Editor** (generalist): whether any text is clear, accurate and consistent. *(no brief yet)*
- UX writer: buttons, prompts, errors and short in-app text that help people act. *(no brief yet)*
- Copy editor: grammar, spelling, punctuation, and one style for terms and names. *(no brief yet)*
- Plain-language editor: short words, short sentences, reading level, jargon. *(no brief yet)*
- Conversion copywriter: store, landing page and ad copy that makes people want it, truthfully. *(no brief yet)*
- Brand voice specialist: whether all text sounds like the same intended voice. *(no brief yet)*
- Technical writer: docs, READMEs and guides people can follow step by step. *(no brief yet)*
- Localization-readiness reviewer: text that will translate: idioms, length, plurals, dates. *(no brief yet)*
- Fact checker: every claim true, current and traceable to a source. *(no brief yet)*

## Games and play

- **Game designer** (generalist): whether a game is fun: goals, choices, pacing, tension. *(no brief yet)*
- [Game-rules editor](games/rules-editor.md): rules a new group can learn in one read, with no gaps to argue over.
- Party game designer: group play: turn-taking, waiting time, social risk, laughs. *(no brief yet)*
- Game balance specialist: fairness, difficulty curves, and strategies that always win. *(no brief yet)*
- Puzzle and trivia editor: one right answer, fair clues, and a spread of difficulty. *(no brief yet)*
- Playtest designer: how to run a playtest and what to watch for. *(no brief yet)*
- Family play specialist: mixed ages playing together: reading level, attention, fairness. *(no brief yet)*
- Social dynamics specialist: how prompts land in a group: embarrassment, exclusion, safety. *(no brief yet)*

## Accessibility

- **Accessibility specialist** (generalist): whether everyone can use it, across sight, hearing, movement and thinking. *(no brief yet)*
- Screen reader specialist: VoiceOver and TalkBack labels, reading order, grouping, announcements. *(no brief yet)*
- Low vision specialist: larger text settings, zoom, contrast, and layouts at the largest sizes. *(no brief yet)*
- Motor and touch specialist: target sizes, gesture alternatives, time limits. *(no brief yet)*
- Cognitive accessibility specialist: memory load, clear steps, reading level, time pressure. *(no brief yet)*
- Color vision specialist: meaning carried by color alone, checked in color-blind simulations. *(no brief yet)*
- Hearing specialist: sound-only cues, captions, and haptics as a backup. *(no brief yet)*

## Engineering

- **Software engineer** (generalist): sound, maintainable code that does what it should. *(no brief yet)*
- [Code reviewer](engineering/code-reviewer.md): bugs, missing tests, risky changes and confusing code in a diff.
- Software architect: module boundaries, dependencies, and where code belongs. *(no brief yet)*
- Refactoring specialist: simpler code with the same behavior. *(no brief yet)*
- Debugging specialist: root causes, not symptoms. *(no brief yet)*
- Performance specialist: slow screens, dropped frames, memory, battery, startup, bundle size. *(no brief yet)*
- Security specialist: secrets, input handling, storage, and what an attacker could reach. *(no brief yet)*
- API designer: interfaces that are easy to use right and hard to use wrong. *(no brief yet)*
- Data and storage specialist: saved data, migrations, offline use, and data loss. *(no brief yet)*
- Dependency specialist: library choices, versions, upgrades and supply-chain risk. *(no brief yet)*

## Platforms

- iOS specialist: Apple conventions, APIs and the Human Interface Guidelines. *(no brief yet)*
- Android specialist: Android conventions, Material Design, device variety, the back gesture. *(no brief yet)*
- React Native and Expo specialist: cross-platform traps, native modules, Expo workflows. *(no brief yet)*
- Web front-end specialist: HTML, CSS, browsers, responsive pages, page speed. *(no brief yet)*
- Backend and cloud specialist: servers, APIs, hosting and running costs. *(no brief yet)*
- Build and release engineer: CI, signing, versioning and release checklists. *(no brief yet)*

## Quality and testing

- **QA lead** (generalist): whether it's ready to ship: risks, coverage, and what to test by hand. *(no brief yet)*
- Test strategist: which tests to write at which level, and which to skip. *(no brief yet)*
- Exploratory tester: odd inputs, interruptions and wrong orders that break things. *(no brief yet)*
- Device and compatibility tester: small screens, old OS versions, slow devices, other languages. *(no brief yet)*
- Regression hunter: what this change could have broken somewhere else. *(no brief yet)*

## Marketing and growth

- **Marketer** (generalist): who it's for, what makes them want it, and where to reach them. *(no brief yet)*
- App store optimization specialist: store name, subtitle, keywords and listing text for search. *(no brief yet)*
- Store creative specialist: screenshots, icon and preview video that win the tap. *(no brief yet)*
- SEO specialist: web pages that rank for what people search. *(no brief yet)*
- Landing page specialist: pages that turn visitors into downloads or sign-ups. *(no brief yet)*
- Launch planner: launch steps, channels and timing, in order. *(no brief yet)*
- Social and community specialist: posts, communities and word of mouth. *(no brief yet)*
- Analytics and experiment specialist: what to measure, A/B tests, reading results honestly. *(no brief yet)*

## Research

- **Researcher** (generalist): what's true about users, and how sure we can be. *(no brief yet)*
- User interviewer: interview guides, questions that don't lead, reading what people say. *(no brief yet)*
- Jobs-to-be-done analyst: the struggle that sends people looking, and what holds them back. *(no brief yet)*
- Survey designer: fair questions and samples that mean something. *(no brief yet)*
- Data analyst: numbers turned into findings, and misleading charts or stats caught. *(no brief yet)*
- Desk researcher: published sources found, checked and cited. *(no brief yet)*

## Legal, privacy and policy

These specialists find gaps and say when a lawyer is needed. They don't give legal advice.

- **Policy and compliance specialist** (generalist): the rules a product must follow, and when to ask a lawyer. *(no brief yet)*
- [Privacy specialist](policy/privacy.md): what data is collected and sent, and whether policy, store labels and consent match.
- App Store review specialist: Apple's App Review Guidelines and what gets rejected. *(no brief yet)*
- Google Play policy specialist: Play policies, the Data safety form, target API rules. *(no brief yet)*
- Children's compliance specialist: children's privacy laws, kids categories and age ratings. *(no brief yet)*
- Licensing specialist: open-source licenses, fonts, images, music and credits. *(no brief yet)*
- Trademark and IP specialist: names, logos, and work too close to someone else's. *(no brief yet)*
- Consumer protection specialist: subscriptions, refunds, price display, claims in ads. *(no brief yet)*

## Sound and media

- Sound designer: sounds that give feedback and set the mood without annoying. *(no brief yet)*
- Music specialist: music choice, loops and licensing. *(no brief yet)*
- Haptics designer: vibrations that mean something. *(no brief yet)*
- Video editor: app previews, trailers and short videos. *(no brief yet)*
- Voice and speech specialist: text-to-speech, voice-over, pronunciation. *(no brief yet)*

## Business and operations

- **Business advisor** (generalist): whether the numbers work and what the business needs next. *(no brief yet)*
- Finance specialist: revenue, costs, store fees, break-even. *(no brief yet)*
- Customer support specialist: help pages, replies, and the questions users will ask. *(no brief yet)*
- Operations specialist: processes, tools and recurring chores. *(no brief yet)*

## AI and agent work

- **Agent workflow designer** (generalist): how agents, skills and people split the work. *(no brief yet)*
- Prompt engineer: prompts that get reliable output. *(no brief yet)*
- Writer for agents: instructions, skills and AGENTS.md files agents follow correctly. *(no brief yet)*
- Eval designer: tests that show whether an AI output or agent setup is good. *(no brief yet)*
- AI cost specialist: token use, model choice, and cheaper ways to the same result. *(no brief yet)*
- AI content reviewer: made-up facts, bias and off-tone output in generated content. *(no brief yet)*

## Challengers

Points of view rather than fields. Useful on plans and decisions as well as finished work.

- Devil's advocate: the strongest case against the plan. *(no brief yet)*
- Pre-mortem facilitator: imagines it failed and works out why. *(no brief yet)*
- Simplifier: what can be cut while the value stays. *(no brief yet)*
- Fresh eyes: a first look with no context: what confuses. *(no brief yet)*
- Skeptical user: what looks too good, vague or staged. *(no brief yet)*
- Ethicist: who could be harmed, left out or misled. *(no brief yet)*

Stand-ins for a project's own audience (its main buyer, a teenager, a gift giver) belong in that
project's docs, not here.
