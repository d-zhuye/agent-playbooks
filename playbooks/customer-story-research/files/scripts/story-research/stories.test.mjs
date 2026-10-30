import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  normalize, quoteMatches, platformOf, canonicalUrl, pageKey, capCount, validateRun, lintRun, lintAudit,
  STORY_TYPES, FORCES, STRENGTHS, CHECKS, PLATFORM_CAP,
} from './stories.mjs';

test('normalize folds typography', () => {
  assert.equal(normalize('“We’re  DONE”\n— really…'), '"we\'re done" - really...');
});

test('normalize drops emoji and zero-width characters', () => {
  assert.equal(normalize('we loved it 😍👍🏽 so much​'), 'we loved it so much');
});

test('quoteMatches ignores case, spacing and quote marks', () => {
  assert.ok(quoteMatches('we’re finally done here', 'Honestly WE\'RE\n  finally done here.'));
});

test('quoteMatches ignores emoji the quote left out', () => {
  assert.ok(quoteMatches('we loved it so much', 'and we loved it ❤️ so much!'));
});

test('quoteMatches needs whole words at both ends', () => {
  assert.ok(!quoteMatches('we bought a car', 'we bought a carpet'));
  assert.ok(!quoteMatches('bought a car', 'rebought a car'));
});

test('quoteMatches treats a contraction as part of the word', () => {
  // Final review: "can" matched inside "can't", inverting the meaning.
  assert.ok(!quoteMatches('honestly I think we can', 'Honestly I think we can’t do another drive.'));
  assert.ok(!quoteMatches('we told them we won', "we told them we won't stop"));
  assert.ok(!quoteMatches('it was the kid', "it was the kid's idea"));
  assert.ok(!quoteMatches('t do another drive', "we can't do another drive"));
  assert.ok(quoteMatches('it was the kids', "it was the kids' idea"));
  assert.ok(quoteMatches("I think we can't", "Honestly I think we can't do another drive."));
});

test('normalize removes soft hyphens and zero-width characters inside words', () => {
  assert.equal(normalize('inter­national fun​word'), 'international funword');
});

test('quoteMatches finds a later whole-word occurrence', () => {
  assert.ok(quoteMatches('we bought a car', 'we bought a carpet, then we bought a car.'));
});

test('quoteMatches rejects ellipses, short and empty quotes', () => {
  assert.ok(!quoteMatches('kids were bored ... so we played', 'kids were bored ... so we played'));
  assert.ok(!quoteMatches('kids were bored… so we played', 'kids were bored… so we played'));
  assert.ok(!quoteMatches('...', 'anything at all here'));
  assert.ok(!quoteMatches('so bored', 'we were so bored'));
  assert.ok(!quoteMatches('', 'we were so bored'));
});

test('quoteMatches rejects altered words', () => {
  assert.ok(!quoteMatches('the kids were furious', 'the kids were bored'));
});

test('platformOf and canonicalUrl strip the same prefixes', () => {
  assert.equal(platformOf('https://old.reddit.com/r/x'), 'reddit.com');
  assert.equal(platformOf('https://apps.apple.com/us/app/x'), 'apps.apple.com');
  assert.equal(platformOf('https://m.Example.org/a'), 'example.org');
  assert.equal(canonicalUrl('https://old.reddit.com/r/x/1'), canonicalUrl('https://www.reddit.com/r/x/1'));
});

test('platformOf counts one site under its other names as one platform', () => {
  // Final review: new., np. and redd.it escaped the cap for one site.
  for (const url of ['https://new.reddit.com/r/x', 'https://np.reddit.com/r/x', 'https://redd.it/abc']) {
    assert.equal(platformOf(url), 'reddit.com', url);
  }
  assert.equal(platformOf('https://itunes.apple.com/us/rss/customerreviews/id=1/json'), 'apps.apple.com');
  assert.equal(platformOf('https://www.amazon.co.uk/review/R1'), 'amazon.com');
  // Shared blog hosts are one platform, and their subdomains often carry a person's name.
  assert.equal(platformOf('https://someone.substack.com/p/x'), 'substack.com');
  assert.equal(platformOf('https://someone.blogspot.com/2020/x'), 'blogspot.com');
  assert.equal(platformOf('https://someone.wordpress.com/x'), 'wordpress.com');
  assert.equal(platformOf('https://forum.example.org/x'), 'forum.example.org');
});

test('canonicalUrl drops fragment and tracking params only', () => {
  assert.equal(canonicalUrl('https://www.Forum.com/viewtopic.php?t=12&utm_source=x&fbclid=y#p3'),
    'https://forum.com/viewtopic.php?t=12');
  assert.equal(canonicalUrl('https://a.com/x?gclid=1'), 'https://a.com/x');
});

test('canonicalUrl treats http and a trailing slash as the same page', () => {
  assert.equal(canonicalUrl('http://a.com/t/1/'), canonicalUrl('https://a.com/t/1'));
  assert.equal(canonicalUrl('https://a.com/'), 'https://a.com/');
});

test('pageKey is stable across URL forms', () => {
  assert.equal(pageKey('https://www.a.com/x#y'), pageKey('https://a.com/x?utm_medium=z'));
  assert.match(pageKey('https://a.com/x'), /^[0-9a-f]{12}$/);
});

test('capCount rounds up a fifth of the target', () => {
  assert.equal(capCount(60), 12);
  assert.equal(capCount(8), 2);
  assert.equal(PLATFORM_CAP, 0.2);
  // No floating-point surprises: every target agrees with integer arithmetic.
  for (let n = 1; n <= 500; n += 1) assert.equal(capCount(n), Math.ceil(n / 5), `target ${n}`);
});

test('the shared constants hold the spec values', () => {
  assert.deepEqual(STORY_TYPES, ['switch', 'plea', 'review', 'counter']);
  assert.deepEqual(FORCES, ['push', 'pull', 'anxiety', 'habit']);
  assert.deepEqual(STRENGTHS, ['weak', 'clear', 'strong']);
  assert.deepEqual(CHECKS, ['pending', 'checked', 'not-found', 'unrechecked']);
});

// A run with one story that passes the 'final' phase.
function finalRun() {
  return {
    run: { date: '2026-10-29', product: 'A card game', target: 8, solutionWords: ['game'] },
    stories: [{
      id: 's001', thread: 'https://forum.example/t/1', platform: 'forum.example',
      posted: '2025-06-01', found: '2026-10-29', type: 'switch', speaker: 'poster', related: [],
      situation: 'long drive', group: 'two adults, kids 6 and 9', excess: false,
      quotes: [
        { id: 'q1', text: 'the kids were bored within an hour', url: 'https://forum.example/t/1', check: 'checked' },
        { id: 'q2', text: 'we bought a deck of cards', url: 'https://forum.example/t/1', check: 'unrechecked' },
      ],
      trigger: 'the night before the trip',
      job: 'When we drive for hours, I want something to do together, so I can keep everyone calm.',
      forces: {
        push: { summary: 'Bored kids', strength: 'strong', quotes: ['q1'] },
        pull: { summary: 'Cards looked easy', strength: 'clear', quotes: ['q2'] },
        anxiety: null,
        habit: null,
      },
      fit: {
        parts: [
          { score: 2, reason: 'together in the car' },
          { score: 1, reason: 'a few hours' },
          { score: null, reason: 'not shown' },
          { score: 2, reason: 'chose cards over tablets' },
          { score: 0, reason: 'says they never buy anything' },
        ],
        total: 5, shown: 4, confidence: 'solid',
      },
    }],
  };
}

test('validateRun passes a valid final story', () => {
  assert.deepEqual(validateRun(finalRun(), 'final'), []);
});

test('validateRun names each bad field once', () => {
  const cases = [
    ['type', (s) => { s.type = 'rant'; }],
    ['speaker', (s) => { s.speaker = 'jenny_mum82'; }],
    ['q1 text', (s) => { s.quotes[0].text = 'kids were bored ... so we played'; }],
    ['q1 text', (s) => { s.quotes[0].text = 'so bored'; }],
    ['q1 url', (s) => { delete s.quotes[0].url; }],
    ['forces.push.strength', (s) => { s.forces.push.strength = 'huge'; }],
    ['forces.push.quotes', (s) => { s.forces.push.quotes = ['q9']; }],
    ['forces.push.quotes', (s) => { s.forces.push.quotes = []; }],
    ['forces.habit', (s) => { delete s.forces.habit; }],
    ['fit.parts', (s) => { s.fit.parts.splice(2, 1); }],
    ['fit.parts[1].score', (s) => { s.fit.parts[1].score = 3; }],
    ['fit.total', (s) => { s.fit.total = 6; }],
  ];
  for (const [field, change] of cases) {
    const data = finalRun();
    change(data.stories[0]);
    const errors = validateRun(data, 'final');
    assert.equal(errors.length, 1, `${field}: ${JSON.stringify(errors)}`);
    assert.ok(errors[0].includes('s001'), errors[0]);
    assert.ok(errors[0].includes(field), `expected "${field}" in: ${errors[0]}`);
  }
});

test('validateRun allows null forces and fit in the checked phase only', () => {
  const data = finalRun();
  Object.assign(data.stories[0], { forces: null, fit: null, trigger: null, job: null });
  assert.deepEqual(validateRun(data, 'checked'), []);
  const errors = validateRun(data, 'final');
  assert.equal(errors.length, 2, JSON.stringify(errors));
  assert.ok(errors.some((e) => e.includes('s001') && e.includes('forces')));
  assert.ok(errors.some((e) => e.includes('s001') && e.includes('fit')));
});

test('validateRun needs forces but not fit in the rated phase', () => {
  // The findings are written from forces alone, before fit is merged.
  const data = finalRun();
  data.stories[0].fit = null;
  assert.deepEqual(validateRun(data, 'rated'), []);
  data.stories[0].forces = null;
  const errors = validateRun(data, 'rated');
  assert.equal(errors.length, 1, JSON.stringify(errors));
  assert.ok(errors[0].includes('s001') && errors[0].includes('forces'));
});

test('lintRun flags long situation labels and guessed genders', () => {
  const data = finalRun();
  assert.deepEqual(lintRun(data), []);
  const s = data.stories[0];
  s.situation = 'a very long description of the whole trip including where they went and why';
  s.forces.push.summary = 'She was worn out by the bored kids';
  const warnings = lintRun(data);
  assert.equal(warnings.length, 2, JSON.stringify(warnings));
  assert.ok(warnings.some((w) => w.startsWith('s001: situation') && w.includes('short label')));
  assert.ok(warnings.some((w) => w.includes('forces.push.summary') && w.includes('"She"')));
});

test('lintRun and lintAudit leave names alone', () => {
  // The owner's call: authors' names are kept so a human can find a post again.
  const data = finalRun();
  data.stories[0].group = 'two adults, kids 6 and 9, with @mum82';
  data.stories[0].fit.parts[1].reason = 'ryan1 says the drive took hours';
  assert.deepEqual(lintRun(data), []);
  assert.deepEqual(lintAudit({ s003: { note: 'All quotes are godfather927’s own words.' } }), []);
});

test('lintAudit flags guessed genders in the audit notes', () => {
  assert.deepEqual(lintAudit({ s003: { note: 'q2 is the poster’s own words; s001 and q4 are fine.' } }), []);
  const warnings = lintAudit({ s003: { note: 'All quotes are the poster’s, and he stood by them.' } });
  assert.equal(warnings.length, 1, JSON.stringify(warnings));
  assert.ok(warnings[0].startsWith('audit s003: note'));
});

test('validateRun accepts an author, a word count and quote notes, and checks their types', () => {
  const data = finalRun();
  Object.assign(data.stories[0], { author: 'mum_of_3', words: 240 });
  data.stories[0].quotes[0].note = 'about the drive home, not the wait';
  assert.deepEqual(validateRun(data, 'final'), []);
  Object.assign(data.stories[0], { author: null, words: null });
  assert.deepEqual(validateRun(data, 'final'), []);
  const cases = [
    ['author', (st) => { st.author = 42; }],
    ['words', (st) => { st.words = 'long'; }],
    ['words', (st) => { st.words = -5; }],
    ['q1 note', (st) => { st.quotes[0].note = 7; }],
  ];
  for (const [field, change] of cases) {
    const d = finalRun();
    change(d.stories[0]);
    const errors = validateRun(d, 'final');
    assert.equal(errors.length, 1, `${field}: ${JSON.stringify(errors)}`);
    assert.ok(errors[0].includes(field), errors[0]);
  }
});

test('validateRun skips analysis checks for excess stories', () => {
  const data = finalRun();
  Object.assign(data.stories[0], { excess: true, forces: null, fit: null });
  assert.deepEqual(validateRun(data, 'final'), []);
});

test('validateRun rejects quotes the check should have dropped or never ran on', () => {
  for (const check of ['not-found', 'pending']) {
    const data = finalRun();
    data.stories[0].quotes[1].check = check;
    const errors = validateRun(data, 'checked');
    assert.equal(errors.length, 1, JSON.stringify(errors));
    assert.ok(errors[0].includes('s001') && errors[0].includes('q2 check'), errors[0]);
  }
});

test('validateRun accepts only http and https links', () => {
  const data = finalRun();
  data.stories[0].quotes[0].url = 'javascript:alert(1)';
  const errors = validateRun(data, 'final');
  assert.equal(errors.length, 1, JSON.stringify(errors));
  assert.ok(errors[0].includes('s001') && errors[0].includes('q1 url'), errors[0]);
  data.stories[0].quotes[0].url = 'https://forum.example/t/1';
  data.stories[0].thread = 'data:text/html,hi';
  assert.ok(validateRun(data, 'final').some((e) => e.includes('thread')));
});

test('validateRun rejects related ids that do not exist', () => {
  const data = finalRun();
  data.stories[0].related = ['s404'];
  const errors = validateRun(data, 'final');
  assert.equal(errors.length, 1, JSON.stringify(errors));
  assert.ok(errors[0].includes('s001') && errors[0].includes('related'), errors[0]);
});
