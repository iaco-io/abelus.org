// phonotactics: whether a word fits the language's sound rules (src/phonotactics.json, edited in the cms).
// letter groups (I, V, …) and a syllable made of them, like σ → ({I, C₁C₂}) V ({M, F}). a word is one or more
// syllables in a row; a group can be kept to the middle of words (_.) or their end (_#)

/** @typedef {{ name: string, letters: string, where: 'anywhere' | 'middle' | 'end' }} Group */
/** @typedef {{ groups: Group[], syllable: string }} Rules */

/**
 * every way a syllable can be spelled in groups. the syllable is written like σ → ({I, C₁C₂}) V ({M, F}):
 * ( … ) is optional, { a, b } is one of them (required), "σ →" in front is optional, and group names can be
 * written together (C₁C₂)
 * @param {string} text @param {string[]} names
 */
export function syllables(text, names) {
	const source = text.replace(/^\s*σ\s*(→|->|=)?\s*/, '');
	// split into ( ) { } , and group names, the longest name that fits first
	const byLength = [...names].sort((a, b) => b.length - a.length);
	/** @type {string[]} */
	const tokens = [];
	for (let at = 0; at < source.length; ) {
		const c = source[at];
		if (/\s/.test(c)) at++;
		else if ('(){},'.includes(c)) (tokens.push(c), at++);
		else {
			const name = byLength.find((n) => source.startsWith(n, at));
			if (!name) throw new Error(`no letter group called ${source.slice(at).match(/^[^\s(){},]+/)?.[0]}`);
			tokens.push(name);
			at += name.length;
		}
	}
	let i = 0;
	const stops = [')', '}', ','];
	/** @returns {string[][]} */
	const sequence = () => {
		let all = [/** @type {string[]} */ ([])];
		while (i < tokens.length && !stops.includes(tokens[i])) {
			const part = item();
			all = all.flatMap((a) => part.map((b) => [...a, ...b]));
		}
		return all;
	};
	/** @returns {string[][]} */
	const item = () => {
		const t = tokens[i++];
		if (t !== '(' && t !== '{') return [[t]];
		const close = t === '(' ? ')' : '}';
		let choices = sequence();
		while (tokens[i] === ',') (i++, (choices = [...choices, ...sequence()]));
		if (tokens[i++] !== close) throw new Error(`a ${t} is not closed`);
		return t === '(' ? [[], ...choices] : choices;
	};
	const all = sequence();
	if (i < tokens.length) throw new Error(`unexpected ${tokens[i]}`);
	const seen = new Set();
	return all.filter((s) => s.length && !seen.has(s.join(' ')) && seen.add(s.join(' ')));
}

/**
 * checks one word: its syllables if it fits (shortest first, so a consonant starts the next syllable when it
 * can), or how far it fits
 * @param {string} word @param {Rules} rules
 * @returns {{ ok: true, syllables: string[] } | { ok: false, upTo: number }}
 */
function checkWord(word, rules) {
	const groups = new Map(rules.groups.map((g) => [g.name, { where: g.where, letters: g.letters.split(/[\s,]+/).filter(Boolean) }]));
	const shapes = syllables(rules.syllable, [...groups.keys()]);
	let furthest = 0;
	/** @type {Map<number, string[] | null>} */
	const memo = new Map();

	/** where a syllable spelled `shape` from `at` can end */
	const ends = (/** @type {string[]} */ shape, /** @type {number} */ k, /** @type {number} */ at) => {
		if (k === shape.length) return [at];
		const g = /** @type {NonNullable<ReturnType<typeof groups.get>>} */ (groups.get(shape[k]));
		return g.letters.flatMap((l) => {
			if (!word.startsWith(l, at)) return [];
			const end = at + l.length;
			if ((g.where === 'end' && end !== word.length) || (g.where === 'middle' && end === word.length)) return [];
			return ends(shape, k + 1, end);
		});
	};
	/** @returns {string[] | null} */
	const from = (/** @type {number} */ at) => {
		furthest = Math.max(furthest, at);
		if (at === word.length) return [];
		if (memo.has(at)) return /** @type {string[] | null} */ (memo.get(at));
		memo.set(at, null);
		const options = [...new Set(shapes.flatMap((s) => ends(s, 0, at)))].sort((a, b) => a - b);
		for (const end of options) {
			const rest = from(end);
			if (rest) return memo.set(at, [word.slice(at, end), ...rest]).get(at) ?? null;
		}
		return null;
	};
	const found = from(0);
	return found ? { ok: true, syllables: found } : { ok: false, upTo: furthest };
}

/**
 * checks a word as written (several words, like "a akvo", each on their own): what to show for it,
 * like "la·pas" or "la|xpas", whether it all fits, and letters no group has. no rules yet: null
 * @param {string} text @param {Rules | null | undefined} rules
 */
export function check(text, rules) {
	if (!rules?.groups.length || !rules.syllable.trim()) return null;
	// a syllable that can't be read checks nothing (the phonotactics popup says what's wrong)
	try {
		syllables(rules.syllable, rules.groups.map((g) => g.name));
	} catch {
		return null;
	}
	const words = text.replace(/<\/?(tp|al)>/g, '').toLowerCase().split(/[\s-]+/).filter(Boolean);
	if (!words.length) return null;
	const results = words.map((w) => {
		const r = checkWord(w, rules);
		return { ok: r.ok, shown: r.ok ? r.syllables.join('·') : `${w.slice(0, r.upTo)}|${w.slice(r.upTo)}` };
	});
	// letters that no group has can never fit: named, so it's clear why
	const known = rules.groups.flatMap((g) => g.letters.split(/[\s,]+/)).join('');
	const unknown = [...new Set(words.join('').split('').filter((c) => !known.includes(c)))];
	return {
		ok: results.every((r) => r.ok),
		shown: results.map((r) => r.shown).join(' '),
		unknown
	};
}
