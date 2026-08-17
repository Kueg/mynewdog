/* Browser build of scoring-engine-v3.ts. Keep this in sync with calibration v3. */
(function (root) {
  const BASE_WEIGHTS = {
    activity: 3, mentalWork: 2, biddability: 3, independence: 3, recall: 3,
    preyDrive: 3, guarding: 3, strangerFriendliness: 2, dogSociability: 2,
    affection: 2, offSwitch: 2, sensitivity: 2, vocality: 2, grooming: 1.5,
    reactivity: 1, shedding: 1, drool: 1, power: 2, healthBurden: 2.5
  };

  const TRAIT_RANGES = {
    activity: { min: 2, max: 5 }, mentalWork: { min: 3, max: 5 }, biddability: { min: 1.5, max: 5 },
    independence: { min: 1.5, max: 4.5 }, recall: { min: 1.5, max: 4.5 }, preyDrive: { min: 1.5, max: 5 },
    guarding: { min: 1, max: 5 }, strangerFriendliness: { min: 1.5, max: 5 }, dogSociability: { min: 1.5, max: 5 },
    affection: { min: 2.5, max: 5 }, offSwitch: { min: 1, max: 4.5 }, sensitivity: { min: 1, max: 5 },
    vocality: { min: 1, max: 5 }, grooming: { min: 1, max: 5 }, reactivity: { min: 1, max: 5 },
    shedding: { min: 1, max: 5 }, drool: { min: 1, max: 5 }, power: { min: 1, max: 4.5 }, healthBurden: { min: 1, max: 5 }
  };

  const clamp = (number, min = 0, max = 100) => Math.max(min, Math.min(max, number));

  function normalizeBreedTrait(trait, raw) {
    const range = TRAIT_RANGES[trait];
    if (range.max === range.min) return 3;
    return clamp(1 + 4 * (raw - range.min) / (range.max - range.min), 1, 5);
  }

  const targetMatch = (user, breed) => clamp(100 - 20 * Math.abs(user - breed));
  function maximumMatch(user, breed) {
    if (breed <= user) return 100;
    const difference = breed - user;
    if (difference <= 1) return 70;
    if (difference <= 2) return 40;
    if (difference <= 3) return 10;
    return 0;
  }
  function minimumMatch(user, breed) {
    if (breed >= user) return 100;
    const difference = user - breed;
    if (difference <= 1) return 70;
    if (difference <= 2) return 40;
    if (difference <= 3) return 10;
    return 0;
  }
  function asymmetricTargetMatch(user, breed) {
    if (breed > user) return clamp(100 - 25 * (breed - user));
    return clamp(100 - 10 * (user - breed), 60, 100);
  }

  function userKey(trait) {
    const maximumKeys = {
      preyDrive: 'preyDriveMax', sensitivity: 'sensitivityMax', vocality: 'vocalityMax', grooming: 'groomingMax',
      reactivity: 'reactivityMax', shedding: 'sheddingMax', drool: 'droolMax', power: 'powerMax', healthBurden: 'healthBurdenMax'
    };
    if (trait === 'biddability') return 'biddabilityMin';
    if (trait === 'recall') return 'recallMin';
    if (trait === 'dogSociability') return 'dogSociabilityMin';
    return maximumKeys[trait] || trait;
  }

  function mode(trait) {
    if (trait === 'activity' || trait === 'mentalWork') return 'asymmetric';
    if (trait === 'biddability' || trait === 'recall' || trait === 'dogSociability') return 'minimum';
    if (['preyDrive', 'sensitivity', 'vocality', 'grooming', 'reactivity', 'shedding', 'drool', 'power', 'healthBurden'].includes(trait)) return 'maximum';
    return 'target';
  }

  function contextMultiplier(trait, flags) {
    let multiplier = 1;
    if (trait === 'preyDrive' && flags.includes('CAT')) multiplier *= 2.25;
    if (trait === 'preyDrive' && flags.includes('SMALL_PETS')) multiplier *= 3;
    if (trait === 'dogSociability' && flags.includes('DOG')) multiplier *= 2.25;
    if (trait === 'reactivity' && flags.includes('YOUNG_CHILDREN')) multiplier *= 1.25;
    else if (trait === 'reactivity' && flags.includes('CHILDREN')) multiplier *= 1.15;
    if (trait === 'guarding' && flags.includes('YOUNG_CHILDREN')) multiplier *= 1.2;
    return multiplier;
  }

  function criticalCap(user, details) {
    const caps = [];
    user.dealbreakers.forEach((trait) => {
      const detail = details[trait];
      if (!detail) return;
      if (detail.match <= 10) caps.push({ cap: 50, reason: `dealbreaker:${trait}:severe` });
      else if (detail.match <= 40) caps.push({ cap: 65, reason: `dealbreaker:${trait}:major` });
    });
    const activity = details.activity;
    if (activity) {
      const difference = activity.breed - activity.user;
      if (difference >= 3) caps.push({ cap: 50, reason: 'activity_excess_extreme' });
      else if (difference >= 2) caps.push({ cap: 65, reason: 'activity_excess_major' });
    }
    const prey = details.preyDrive;
    if (prey && user.flags.includes('SMALL_PETS')) {
      if (prey.match <= 10) caps.push({ cap: 40, reason: 'smallpets_prey_severe' });
      else if (prey.match <= 40) caps.push({ cap: 55, reason: 'smallpets_prey_major' });
    } else if (prey && user.flags.includes('CAT')) {
      if (prey.match <= 10) caps.push({ cap: 50, reason: 'cat_prey_severe' });
      else if (prey.match <= 40) caps.push({ cap: 65, reason: 'cat_prey_major' });
    }
    const dog = details.dogSociability;
    if (dog && user.flags.includes('DOG')) {
      if (dog.match <= 10) caps.push({ cap: 50, reason: 'resident_dog_severe' });
      else if (dog.match <= 40) caps.push({ cap: 65, reason: 'resident_dog_major' });
    }
    const health = details.healthBurden;
    if (health) {
      if (health.user === 1 && health.breed >= 4) caps.push({ cap: 55, reason: 'health_very_strict' });
      else if (health.user === 2 && health.breed >= 5) caps.push({ cap: 65, reason: 'health_strict' });
    }
    const guard = details.guarding;
    if (guard && guard.user === 1 && guard.breed >= 4.5) caps.push({ cap: 60, reason: 'guarding_unwanted_extreme' });
    const power = details.power;
    if (power && user.dealbreakers.includes('power')) {
      const difference = power.breed - power.user;
      if (difference >= 3) caps.push({ cap: 50, reason: 'power_severe' });
      else if (difference >= 2) caps.push({ cap: 65, reason: 'power_major' });
    }
    if (!caps.length) return { cap: 100, reasons: [] };
    const cap = Math.min(...caps.map((item) => item.cap));
    return { cap, reasons: caps.filter((item) => item.cap === cap).map((item) => item.reason) };
  }

  function scoreBreed(user, breed) {
    if (!breed || !breed.scoringEligible) return null;
    let weighted = 0;
    let total = 0;
    const details = {};
    Object.keys(BASE_WEIGHTS).forEach((trait) => {
      const rawBreed = breed.traits && breed.traits[trait];
      const key = userKey(trait);
      const userValue = user.values[key];
      if (rawBreed == null || userValue == null) return;
      const breedValue = normalizeBreedTrait(trait, rawBreed);
      const dataConfidence = (breed.traitConfidence && breed.traitConfidence[trait] && breed.traitConfidence[trait].factor) || 0.6;
      const answerConfidence = (user.userConfidence && user.userConfidence[key]) == null ? 1 : user.userConfidence[key];
      let weight = BASE_WEIGHTS[trait];
      if (user.dealbreakers.includes(trait)) weight *= 2.5;
      weight *= contextMultiplier(trait, user.flags) * dataConfidence * answerConfidence;
      const matchType = mode(trait);
      const match = matchType === 'target' ? targetMatch(userValue, breedValue)
        : matchType === 'minimum' ? minimumMatch(userValue, breedValue)
          : matchType === 'maximum' ? maximumMatch(userValue, breedValue)
            : asymmetricTargetMatch(userValue, breedValue);
      weighted += match * weight;
      total += weight;
      details[trait] = { match, weight, user: userValue, breed: breedValue, rawBreed };
    });
    const childEvidence = breed.contextEvidence && breed.contextEvidence.youngChildrenAkcScore;
    if (childEvidence != null && (user.flags.includes('YOUNG_CHILDREN') || user.flags.includes('CHILDREN'))) {
      const childWeight = user.flags.includes('YOUNG_CHILDREN') ? 0.8 : 0.4;
      weighted += targetMatch(5, childEvidence) * childWeight * 0.6;
      total += childWeight * 0.6;
    }
    if (!total) return null;
    const rawCompatibility = weighted / total;
    const capped = criticalCap(user, details);
    return { compatibility: Math.round(Math.min(rawCompatibility, capped.cap) * 10) / 10, rawCompatibility: Math.round(rawCompatibility * 10) / 10, cap: capped.cap, criticalReasons: capped.reasons, details };
  }

  function aggregateFciGroups(items) {
    const groups = new Map();
    items.forEach((item) => {
      const groupItems = groups.get(item.breed.fciGroup) || [];
      groupItems.push(item);
      groups.set(item.breed.fciGroup, groupItems);
    });
    return [...groups.entries()].map(([group, groupItems]) => {
      const familyBest = new Map();
      groupItems.forEach((item) => {
        const family = item.breed.breedFamily || item.breed.id;
        const previous = familyBest.get(family);
        if (!previous || item.score > previous.score || (item.score === previous.score && item.rawScore > previous.rawScore)) familyBest.set(family, item);
      });
      const topBreeds = [...familyBest.values()].sort((a, b) => b.score - a.score || b.rawScore - a.rawScore).slice(0, 3);
      const weights = topBreeds.length === 1 ? [1] : topBreeds.length === 2 ? [0.72, 0.28] : [0.65, 0.25, 0.1];
      const score = topBreeds.reduce((sum, item, index) => sum + item.score * weights[index], 0);
      return { group, score: Math.round(score * 10) / 10, topBreeds };
    }).sort((a, b) => b.score - a.score);
  }

  function resultConfidence({ groupGap, weightedBreedDataConfidence, answerConfidence }) {
    const margin = groupGap >= 8 ? 1 : groupGap >= 4 ? 0.8 : groupGap >= 2 ? 0.65 : 0.5;
    const value = 0.45 * weightedBreedDataConfidence + 0.25 * answerConfidence + 0.3 * margin;
    return { value: Math.round(value * 100) / 100, label: value >= 0.85 ? 'high' : value >= 0.7 ? 'medium' : 'low' };
  }

  function fitLabel(score) {
    if (score >= 85) return 'high';
    if (score >= 78) return 'good';
    if (score >= 70) return 'moderate';
    return 'weak';
  }

  root.DogScoring = { BASE_WEIGHTS, TRAIT_RANGES, normalizeBreedTrait, targetMatch, maximumMatch, minimumMatch, asymmetricTargetMatch, scoreBreed, aggregateFciGroups, resultConfidence, fitLabel, userKey, mode };
})(window);
