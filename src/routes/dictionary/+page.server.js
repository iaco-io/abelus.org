import { dictionary } from '#lib/content.js';
import { LANGUAGES } from '#lib/dictionary.js';

// every word with what the list shows and what search looks through
export function load() {
	return {
		words: dictionary.map(({ url, title, word }) => ({
			url,
			title,
			pos: word.pos,
			forms: word.forms.map((f) => f.form),
			translations: Object.fromEntries(word.translations.map((t) => [t.code, t.words])),
			// what the forms translate to: found by search too
			formTranslations: Object.fromEntries(
				LANGUAGES.map(({ code }) => [code, word.forms.flatMap((f) => f.translations.find((t) => t.code === code)?.words ?? [])])
			)
		}))
	};
}
