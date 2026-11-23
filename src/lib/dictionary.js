// the dictionary: abelus words, one file each in src/dictionary/<word>.md, each opened at /<word>/.
// affixes (src/affixes.json, edited in the cms) make each word's other forms: "-a" is a suffix, "a-" a prefix

// the languages a word is translated into. add one here: it shows up in the cms, on word pages and in search
export const LANGUAGES = [
	{ code: 'en', name: 'english' },
	{ code: 'eo', name: 'esperanto' },
	{ code: 'fr', name: 'french' },
	{ code: 'it', name: 'italian' },
	{ code: 'no', name: 'norwegian' },
	{ code: 'pt', name: 'portuguese' }
];

// suggestions in the cms; any other part of speech can be typed too
export const PARTS = ['noun', 'verb', 'adjective', 'adverb', 'pronoun', 'preposition', 'conjunction', 'interjection', 'numeral', 'particle'];

// the word as typed, without <al>/<tp> marks
const bare = (/** @type {string} */ t) => t.replace(/<\/?(tp|al)>/g, '');

/** 'a, b' or ['a', 'b'] becomes ['a', 'b'] */
export const list = (/** @type {unknown} */ v) =>
	[v ?? []].flat().flatMap((x) => String(x).split(',')).map((x) => x.trim()).filter(Boolean);

/** @typedef {{ affix: string, pos: string }} Affix */

/** the word's other forms, one for each affix that makes another part of speech */
export function forms(/** @type {string} */ word, /** @type {string} */ pos, /** @type {Affix[]} */ affixes) {
	const base = bare(word).trim().toLowerCase();
	if (!base) return [];
	return affixes
		.map((a) => ({ affix: a.affix.trim(), pos: a.pos.trim() }))
		.filter((a) => a.pos && a.pos !== pos && /^-[^-]+$|^[^-]+-$/.test(a.affix))
		.map((a) => ({ pos: a.pos, form: a.affix.startsWith('-') ? base + a.affix.slice(1) : a.affix.slice(0, -1) + base }));
}

/** everything a word page shows below its title, from the word's properties */
export function wordInfo(/** @type {Record<string, any>} */ meta, /** @type {Affix[]} */ affixes) {
	const pos = String(meta.pos ?? '').trim();
	return {
		pos,
		pronunciation: String(meta.pronunciation ?? '').trim(),
		translations: LANGUAGES.map((l) => ({ ...l, words: list(meta[l.code]) })).filter((l) => l.words.length),
		forms: forms(meta.title ?? '', pos, affixes),
		examples: [meta.examples ?? []].flat().map((x) => String(x).trim()).filter(Boolean),
		related: list(meta.related)
	};
}

/** lowercase, without accents: "Água" finds "agua" */
export const fold = (/** @type {string} */ t) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** a word to a file name (and so its address): "Água Fria" becomes agua-fria */
export const slug = (/** @type {string} */ t) => fold(bare(t)).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
