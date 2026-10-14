# Reviewing the playbooks

Reviews keep this repo useful: they act on what projects report, promote what has proven itself,
and cut what no longer helps. There are two levels:

| Level | Scope | When | Question it answers |
|---|---|---|---|
| Playbook review | One playbook and its notes | Monthly sweep, only for playbooks that have enough new notes | Is this playbook still right? |
| Repo review | Everything: journal, playbooks, notes, this process | Every 3 months | Is the collection still right? |

To run one, tell an agent: "Run the monthly sweep in REVIEWING.md" or "Run the repo review in
REVIEWING.md".

## Rules against overreacting

Reviews should respond to patterns, not single reports.

- **One report is a data point.** A single "didn't" or "changed" note is recorded and left alone,
  unless it says the playbook is broken outright (a command fails, a link is dead). Fix breakage
  right away with a small patch, not a redesign.
- **Act on a pattern:** the same issue in at least 3 notes, from at least 2 projects where
  possible.
- **Let a change settle.** After changing a playbook, don't judge the change until at least 3 new
  notes have come in since. This keeps a playbook from flipping back and forth.
- **No notes isn't failure.** A playbook nobody has needed lately may still be right. Absence
  matters only at the repo review, over two quarters.

## Monthly sweep: playbook reviews

1. **Find what's due.** For each playbook, count the note lines below the last `REVIEW` line in
   `notes/<name>.md`. A playbook is due if it has **5 or more** new lines, or its last review was
   more than **6 months** ago. If nothing is due, stop and say so.
2. **For each due playbook:**
   1. Read its new notes, then the playbook.
   2. Group the notes by issue. Separate one-off reports from patterns (see the rules above).
   3. Check what may have gone stale: version pins, commands, and claims about how agent tools
      behave. Run or look up what you can.
   4. Decide one of: **no change**; **refine** (fix steps, add a gotcha); **shrink** (cut parts an
      existing tool or skill now covers, and link to it); or **flag for the repo review** (it may
      need merging, splitting or retiring).
   5. Make the edit, then add a line to `notes/<name>.md`:
      `- <YYYY-MM-DD> · REVIEW · <what changed, or "no change">`.
3. **Commit:** `Review <name> playbook: <what changed>`, one commit per playbook.
4. **Report** to the owner in a few lines: what was reviewed, what changed, what was flagged.

## Every 3 months: the repo review

Run the monthly sweep first, then:

1. **Journal.**
   - **Promote** an entry seen in 2 or more projects with something that worked: write it up as a
     playbook ([CONTRIBUTING.md](CONTRIBUTING.md)) and delete the entry.
   - **Fold** an entry that is really a gotcha of an existing playbook into that playbook.
   - **Merge** entries that describe the same problem.
   - **Delete** an entry not seen again in 6 months: it was an isolated case after all.
2. **Playbooks as a set.**
   - Act on everything the sweeps flagged.
   - **Merge or split** playbooks that overlap or have grown to cover two things.
   - **Check the agent rules together.** If two playbooks paste the same or conflicting lines into
     `AGENTS.md`, give the rule one owner and have the other link to it.
   - **Propose retiring** a playbook with only `skipped` notes, or none, for two repo reviews in a
     row. Ask the owner before deleting it.
3. **Patterns across playbooks.** Look for the same failure in notes on different playbooks (for
   example, several setups breaking in fresh worktrees). That is a new journal entry or a shared
   fix.
4. **Trim the notes.** In each notes file, replace lines older than the previous repo review with
   one summary line: `- <YYYY-MM-DD> · SUMMARY · <n> notes: <what they showed>`.
5. **Check this process.** Are notes being written? Did sweeps find work, or always stop early?
   Did any change get reverted? Adjust the thresholds and timing in this file if they're wrong,
   and say why in the review log.
6. **Update [README.md](README.md),** add a line to the review log below, commit
   (`Repo review <YYYY-MM-DD>`) and report to the owner: what was promoted, merged, cut, and what
   needs their decision.

## Review log

One line per repo review: date, what changed, and any change to this process.

- 2026-10-14 · Process set up: journal, notes and two review levels. First repo review due
  2027-01-14.
