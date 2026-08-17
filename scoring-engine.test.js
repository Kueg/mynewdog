/* v3 regression checks. Load after quiz-calculator.js in a browser test page. */
(function () {
  const engine = globalThis.DogScoring;
  const assert = (condition, label) => { if (!condition) throw new Error(`Failed: ${label}`); };
  const traitConfidence = Object.fromEntries(Object.keys(engine.BASE_WEIGHTS).map((trait) => [trait, { label: 'test', factor: 1 }]));
  const breed = (traits, extra = {}) => ({ id: 'test', breedFamily: 'test', fciGroup: 1, scoringEligible: true, traits, traitConfidence, ...extra });
  const profile = (values, extra = {}) => ({ values, flags: [], dealbreakers: [], ...extra });

  // Normalization endpoints and midpoint.
  assert(engine.normalizeBreedTrait('activity', 2) === 1, 'activity min normalizes to 1');
  assert(engine.normalizeBreedTrait('activity', 5) === 5, 'activity max normalizes to 5');
  assert(engine.normalizeBreedTrait('activity', 3.5) === 3, 'activity midpoint normalizes to 3');

  // dogSociability is a minimum, not a target.
  assert(engine.minimumMatch(4, 5) === 100, 'higher dog sociability is accepted');
  assert(engine.minimumMatch(4, 2) === 40, 'low dog sociability is penalized');

  // Split stranger friendliness and guarding can be high + high and low + low.
  assert(engine.targetMatch(5, 5) === 100 && engine.targetMatch(1, 1) === 100, 'split stranger and guard remain independent targets');

  // Critical caps: dealbreaker, cat/small pets, health strictness.
  const dealbreaker = engine.scoreBreed(profile({ vocalityMax: 1 }, { dealbreakers: ['vocality'] }), breed({ vocality: 5 }));
  assert(dealbreaker.cap === 50, 'severe dealbreaker cap');
  const catPrey = engine.scoreBreed(profile({ preyDriveMax: 1 }, { flags: ['CAT'] }), breed({ preyDrive: 5 }));
  assert(catPrey.cap === 50, 'cat prey cap');
  const smallPetsPrey = engine.scoreBreed(profile({ preyDriveMax: 1 }, { flags: ['SMALL_PETS'] }), breed({ preyDrive: 5 }));
  assert(smallPetsPrey.cap === 40, 'small-pet prey cap');
  const health = engine.scoreBreed(profile({ healthBurdenMax: 1 }), breed({ healthBurden: 4 }));
  assert(health.cap === 55, 'health strict cap');

  // FCI aggregation: 1/2/3 families and working/show family dedupe.
  const scored = (family, score, rawScore = score, group = 1) => ({ breed: { id: family + score, breedFamily: family, fciGroup: group }, score, rawScore });
  assert(engine.aggregateFciGroups([scored('a', 80)])[0].score === 80, 'one family aggregation');
  assert(engine.aggregateFciGroups([scored('a', 80), scored('b', 60)])[0].score === 74.4, 'two family aggregation');
  assert(engine.aggregateFciGroups([scored('a', 100), scored('b', 80), scored('c', 60)])[0].score === 91, 'three family aggregation');
  const deduped = engine.aggregateFciGroups([scored('working', 90), scored('working', 80), scored('show', 70)])[0];
  assert(deduped.topBreeds.length === 2 && deduped.score === 84.4, 'breed family dedupe');

  // Weak label, unknown answer confidence representation, and no cost trait.
  assert(engine.fitLabel(69.9) === 'weak', 'weak fit label');
  const unknown = engine.scoreBreed(profile({ sensitivityMax: undefined }, { userConfidence: { sensitivityMax: 0.25 } }), breed({ sensitivity: 5 }));
  assert(unknown === null, 'unknown answer is not silently converted to 3');
  assert(!Object.hasOwn(engine.BASE_WEIGHTS, 'cost'), 'cost is absent from v3 model');
  console.info('DogScoring v3 checks passed');
})();
