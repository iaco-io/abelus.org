// the dictionary: abelus words, one file each in src/dictionary/<word>.md, each opened at /<word>/.
// affixes (src/affixes.json, edited in the cms) make each word's other forms: prefixes go before the word,
// suffixes after it; with a space they stay a separate particle ("a word")

// the languages a word is translated into, each named in itself (lowercase). add one here: it shows up in the cms, on word pages and in search
export const LANGUAGES = [
	{ code: 'en', name: 'english' },
	{ code: 'eo', name: 'esperanto' },
	{ code: 'fr', name: 'français' },
	{ code: 'it', name: 'italiano' },
	{ code: 'no', name: 'norsk' },
	{ code: 'pt', name: 'português' }
];

// suggestions in the cms; any other part of speech can be typed too
export const PARTS = ['noun', 'verb', 'adjective', 'adverb', 'pronoun', 'preposition', 'conjunction', 'interjection', 'numeral', 'particle'];

// the word as typed, without <al>/<tp> marks
const bare = (/** @type {string} */ t) => t.replace(/<\/?(tp|al)>/g, '');

/** 'a, b' or ['a', 'b'] becomes ['a', 'b'] */
export const list = (/** @type {unknown} */ v) =>
	[v ?? []].flat().flatMap((x) => String(x).split(',')).map((x) => x.trim()).filter(Boolean);

/** @typedef {{ affix: string, pos: string, type?: 'prefix' | 'suffix' }} Affix */

/** prefix or suffix; older affixes without one: "-a" and " a" are suffixes, "a-" and "a " prefixes */
export const typeOf = (/** @type {Affix} */ a) => a.type ?? (/^[-\s]/.test(a.affix) ? 'suffix' : 'prefix');

/**
 * the affix on a word, as typed: spaces stay (a separate particle, "a word"), a hyphen on the word's side
 * just means it's attached ("a-" makes "aword")
 */
export function attach(/** @type {Affix} */ a, /** @type {string} */ word) {
	return (typeOf(a) === 'prefix' ? a.affix.replace(/-$/, '') + word : word + a.affix.replace(/^-/, '')).trim();
}

/** the word's other forms, one for each affix that makes another part of speech */
export function forms(/** @type {string} */ word, /** @type {string} */ pos, /** @type {Affix[]} */ affixes) {
	const base = bare(word).trim().toLowerCase();
	if (!base) return [];
	return affixes
		.filter((a) => a.pos.trim() && a.pos.trim() !== pos && a.affix.replace(/[-\s]/g, ''))
		.map((a) => ({ pos: a.pos.trim(), form: attach(a, base) }));
}

/** everything a word page shows below its title, from the word's properties */
export function wordInfo(/** @type {Record<string, any>} */ meta, /** @type {Affix[]} */ affixes) {
	const pos = String(meta.pos ?? '').trim();
	return {
		pos,
		pronunciation: String(meta.pronunciation ?? '').trim(),
		translations: LANGUAGES.map((l) => ({ ...l, words: list(meta[l.code]) })).filter((l) => l.words.length),
		// each form with its own translations, kept by its part of speech: forms: {"verb": {"en": "to water"}}
		forms: forms(meta.title ?? '', pos, affixes).map((f) => ({
			...f,
			translations: LANGUAGES.map((l) => ({ ...l, words: list(meta.forms?.[f.pos]?.[l.code]) })).filter((l) => l.words.length)
		})),
		examples: [meta.examples ?? []].flat().map((x) => String(x).trim()).filter(Boolean),
		related: list(meta.related)
	};
}

/** lowercase, without accents: "Água" finds "agua" */
export const fold = (/** @type {string} */ t) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** a word to a file name (and so its address): "Água Fria" becomes agua-fria */
export const slug = (/** @type {string} */ t) => fold(bare(t)).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
