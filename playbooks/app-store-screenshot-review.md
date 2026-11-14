# App Store screenshot review by an independent agent

A prompt template for a second agent session to review a finished set of App Store screenshots
before upload. The reviewer looks at the frames cold, at the size shoppers see them, then
reviews from 14 roles (shoppers, Apple's reviewer, and specialists), then reads the designer's
reasoning and challenges it. It writes one report and changes nothing. For iOS apps; the roles
and steps carry over to Google Play with the rules swapped.

**Adopt it when** an agent has designed or rebuilt the screenshots and you want a check that
doesn't share its reasoning.

**Unproven.** Written from one project, right after the prompt was drafted and before the
review had run. Sections 6 and 7 say what is still a guess.

---

## 1. Why use it

The agent that designed the frames can't review them well. It knows what each frame is meant to
say, so it reads that meaning into the picture. It also judges at full size, where everything
is readable, while shoppers see three frames about 115 points wide each between rivals.

In the project this came from, the designing agent's own checks missed three things the owner
or a second look caught: speech-bubble tails that pointed away from the speaker, yellow
characters that faded into a yellow background, and a typo in the app's own text inside a
frame.

A second session costs one prompt and about one long agent run. What it must not do is read
the design rationale first: then it reviews the argument, not the pictures.

## 2. How it works

```
designer session   builds the frames, the true-size mocks, the research and the storyboard
owner              fills in the template below and starts a fresh session with it
reviewer session   step 1  looks cold at the mocks and writes first impressions
                   step 2  one pass per role, kept separate
                   step 3  reads the designer's reasoning and challenges it
                   step 4  reads the designer's own doubts, last
                   writes one report; edits nothing; commits nothing
owner              decides which findings to act on; the designer session applies them
```

Three rules shape the template:

1. **Look before reading.** First impressions can be taken only once. The template names the
   reasoning files but forbids opening them until step 3.
2. **Review only.** One report, uncommitted, so the owner reads it before anything changes.
3. **Doubts and decisions come last.** The designer's doubts would steer the reviewer if they
   came first. Decisions the owner has already made are listed so the reviewer doesn't spend
   its time reopening them, with one way out: a serious problem, said once, with evidence.

## 3. Setup checklist

1. **The frames exist as files** at the store's sizes, in upload order.
2. **True-size mocks can be built** with one command each. Two are needed:
   - *Search results:* the app's first three frames at about 115 points wide each, with the
     icon, name and subtitle above, placed between real rivals for each search term that
     matters. Rivals' screenshot URLs come from
     `https://itunes.apple.com/search?term=<term>&entity=software&country=us`.
   - *Product page:* every frame in one row at about 230 points wide each.

   With no mock script, the least that works is a strip of the first three frames at search
   size: `magick 01.png 02.png 03.png -resize 345x +append search-strip.png`.
3. **The designer's reasoning is written down** in files the reviewer can be told not to open
   yet: what the frames are meant to say, the evidence, and the test plan.
4. **The designer writes its own doubts** as a list of questions, one line each.
5. **The owner lists what is already decided.**
6. Fill in every `TODO(project):` in the template, start a fresh session, and paste it.

## 4. Starter code

The prompt, in full. Replace each `TODO(project):`. Drop a role only if it truly can't apply
(the teenager for a tax app); add roles for the app's own audience in the first group.

````markdown
# Review the App Store screenshots for TODO(project): app name

You are reviewing TODO(project): number new App Store screenshots for an iPhone app before
they are uploaded. Another agent designed and built them. You have not seen its reasoning, and
that is on purpose: your value is a fresh pair of eyes. Find what is weak, unclear, untrue or
risky, and say what would make more of the right people download the app.

Review only. Do not edit the frames, the scripts, the app or the listing. Your one output is
a written report (see "What to deliver").

## The app, in brief

TODO(project): four or five sentences. What the app does, who uses it and when, how it makes
money, its age rating, and whether it is released yet (ratings, traffic).

Success means: a person who would enjoy the app sees these frames and downloads it. More
downloads from people who then dislike it is a loss.

## Where things are

Everything is in TODO(project): the checkout's absolute path, on branch
TODO(project): branch. TODO(project): name any other checkout the reviewer must not use.

- The frames: TODO(project): paths and pixel sizes.
- True-size mocks, which you build in step 1.
- The app's own rules: TODO(project): AGENTS.md, the design guide.
- The designer's reasoning, which you read only in step 3: TODO(project): paths.
- How the frames are built: TODO(project): paths.
- The listing text they sit beside: TODO(project): path.

## Step 1: look cold, at the size shoppers see

Do this before you open the designer's reasoning.

1. Run these. TODO(project): the mock commands and where they write.

   The first shows the app's first three frames between real rival apps in search results,
   one picture per search term. It needs the network. The second shows every frame in the
   product page's row. Both are close copies of the App Store's layout, good for comparing,
   not for measuring.
2. Look at each search mock for about five seconds, as a shopper scrolling would. Then write
   down, before looking again:
   - what this app does
   - who it is for
   - TODO(project): the one fact a shopper most needs and most often gets wrong
   - what it costs you (money, ads, sign-up)
   - whether you would tap it, and which rival you would tap instead
3. Look at the product-page mock the same way. Note where your eye went first, what you
   could not read, and where you would have stopped scrolling.
4. Only then open the frames at full size and note anything that changes your first answers.

Keep these notes. They are the most valuable part of the review, because you can only do
this once.

## Step 2: review from each role, one pass per role

Take each role in turn and review the frames only from that seat. Keep the passes separate;
do not blend them until the end. Where a role's claim rests on a fact (an Apple rule, a
rival's page, a study), check it and cite it. Use web search where you need current facts.

**The people who decide**

1. TODO(project): the main buyer, in their situation, with their two or three worries.
2. TODO(project): a second buyer who must not be put off by what attracts the first.
3. TODO(project): a third, if the audience has one (a different age, a gift buyer).
4. **A doubtful shopper who has been burned** by apps that looked free and were not, or
   whose screenshots did not match the app. What here looks too good, vague or staged?
5. **An Apple App Review reviewer.** Check every frame against the current App Review
   Guidelines and screenshot specifications, especially 2.3.3 (screenshots show the app in
   use), 2.3.7, 2.3.8 (metadata must suit a 4+ rating; "For Kids" and "For Children" are
   reserved), 2.3.10 and 2.3.2 (paid content must be marked). Check sizes, format and alpha
   too. Would anything be rejected or queried?

**The specialists**

6. **Human behavior and motivation expert.** What does each frame ask the viewer to feel
   and do? Is the motive for downloading clear? Where is there doubt, effort or mental load?
   Is the trust-building in the right place?
7. **Marketing and positioning expert.** Is there one clear promise? Is it different from
   the rivals'? Is the strongest reason to download in the first frame, or buried? Does the
   order tell a story or just list features?
8. **Conversion copywriter.** Read every word on every frame. Is each line plain, true,
   specific and worth its space? Could a ten-year-old understand it? Is anything clever at
   the cost of clear? Is any claim unbacked?
9. **App Store search and listing expert.** Do the first three frames match what people
   type for this kind of app? Do they work with the app name, subtitle and icon beside
   them, or repeat them? Is the first frame the right one to lead with? What would you test
   first after launch?
10. **Visual and brand designer.** Hierarchy, contrast, spacing, type, color, and how the
    frames hold together as a set. Does anything look unfinished, cramped or off-style
    against the design guide?
11. **Legibility and accessibility reviewer.** What can actually be read at search size and
    at product-page size, on a small phone, in bright light, by someone with weaker
    eyesight or color blindness? Measure contrast where it looks low.
12. **Truth checker.** Compare every frame with the app itself: the code, the free content,
    and the script that builds the frames. Does anything shown not exist, sit behind a
    purchase, or behave differently in the app? Are the words on screen the app's real
    words? Is each caption's claim true in every case? TODO(project): list the claims.
13. **Rival analyst.** Look up the current top results for TODO(project): the search terms
    in the TODO(project): country App Store. What do the leaders' first three frames do
    that these do not, and the reverse? Where would these frames lose a side-by-side
    choice, and to whom?
14. **Test designer.** Read the designer's test plan (you may open that one section now:
    TODO(project): path and heading). Could it tell a good frame from a bad one with the
    traffic this app gets? What would you measure, and what would you change?

If you think of a role that would catch something these miss, add it and say why.

## Step 3: read the designer's reasoning and challenge it

Now read the designer's reasoning in full.

- Where did your cold impressions differ from what the designer intended? Those gaps
  matter more than any agreement.
- Which of the designer's claims rest on weak evidence? Check whether the conclusions
  follow from the sources.
- TODO(project): any large choice the designer made that deserves its own challenge (for
  example, deciding against a Search Results image or a Header image).
- What did the designer not consider at all?

## Step 4: the designer's own doubts

Read these last, and say whether each is a real problem, in your judgment:

TODO(project): the designer's doubts, one question per line.

## Already decided by the owner

Do not spend time reopening these. If you find a serious problem with one (a likely
rejection, a false claim, clear harm to downloads), say so once, with evidence, in its own
section.

TODO(project): the decisions, and any standing rules on copy or art.

## What to deliver

Write one report to TODO(project): path, and do not commit it. Write it for the app's owner,
who will decide what to change. They have seen the frames but not your working. Plain words,
short sentences.

1. **Verdict first:** would you ship these as they are? Then the three changes that would
   matter most, in order.
2. **Your cold notes from step 1,** unedited.
3. **Findings,** most important first. For each one:
   - the frame number, and where on it
   - what is wrong, in one sentence
   - who it affects and what they would do as a result
   - the evidence, with one of these labels: Apple (a rule or statement from Apple, with
     the link), Test (a published test with a sample size), Seen (you observed it in the
     frames, the app or a rival's page), Judgment (your professional opinion)
   - the change you recommend, specific enough to act on: the new words, the new order, or
     what to move
   - severity: Must fix before upload, Should fix, or Worth testing after launch
4. **What works and should not be changed,** so a fix elsewhere does not break it.
5. **Disagreements between roles,** where one role's fix would hurt another's goal, and
   which side you would take.
6. **Decided items you would reopen,** if any, with evidence.
7. **What you could not check,** and how the owner could.

Be direct. A finding that says a frame is "a bit busy" is no use; say what to remove. Do
not pad the list: if a role found nothing, say so in one line. If you think the whole
approach is wrong, say that first and say what you would do instead.
````

## 5. Agent rule

Paste into `AGENTS.md` in a project that ships App Store screenshots:

```md
- After designing or rebuilding App Store screenshots, don't call them ready on your own
  review. Fill in the prompt from the App Store screenshot review playbook and give it to the
  owner to run in a fresh session.
- When writing that prompt, put your reasoning in files the reviewer opens only in step 3,
  and your doubts in step 4. Never summarize your reasoning in the prompt's opening sections.
```

The first line is there because the designer can't see its own frames fresh. The second
is there because one sentence of rationale early in the prompt spoils the cold look.

## 6. Acceptance test

Not yet run. The setup works if:

1. The report's cold notes are dated before any quote from the designer's reasoning, and
   contain at least one misreading or unreadable element. A cold look that finds nothing wrong
   was probably not cold.
2. Every finding has a frame number, an evidence label and a change specific enough to apply
   without asking the reviewer what it meant.
3. The working tree shows one new file, the report, and no other change.
4. A decided item is reopened only with a rule or an observation behind it, never on taste.
5. An agent that has just finished a screenshot set offers this review without being asked.

## 7. Gotchas

- **The search mock needs the network.** Offline, only the product-page row can be built, and
  the review loses its comparison with rivals. Say so in the report.
- **Mocks are usually git-ignored,** so a fresh session finds none. The template makes the
  reviewer build them; check the commands work from a clean checkout first.
- **Two checkouts.** If the frames live in a worktree, give its absolute path and name the
  checkout to avoid. A fresh session opens the main checkout by default.
- **A single session playing 14 roles may blur them.** Untested: whether one pass per role in
  one session holds, or whether each role needs its own subagent. If the report's role
  sections repeat each other, split them.
- **Evidence labels keep vendor claims out.** Most screenshot "best practice" online has no
  method or sample size. Without the labels, the reviewer repeats it as fact.

## 8. What it does not cover

- Designing the frames, the research behind them, or building the mocks.
- A test on real people. The cold look is an agent's, not a shopper's; five people shown a
  search mock for five seconds each is still worth doing.
- Google Play: swap the Apple reviewer for Play's policy and the mock sizes for Play's
  layout.
- App previews (video), the icon, and the listing's words, except where they sit beside the
  frames.

## 9. Builds on

- [App Store review readiness](app-store-review-readiness.md) checks the whole submission as
  Apple's reviewer. This playbook covers only the screenshots, and mostly whether they
  persuade, with the reviewer's rules as one role of 14.
- [Pre-launch search research](pre-launch-search-research.md) supplies the search terms the
  mocks and the rival analyst use.
