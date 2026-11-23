import { dictionary } from '#lib/content.js';

// every word with what the list shows and what search looks through
export function load() {
	return {
		words: dictionary.map(({ url, title, word }) => ({
			url,
			title,
			pos: word.pos,
			forms: word.forms.map((f) => f.form),
			translations: Object.fromEntries(word.translations.map((t) => [t.code, t.words]))
		}))
	};
}
