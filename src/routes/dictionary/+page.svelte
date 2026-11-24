<script>
	// every abelus word, a to z, next to its translation in the language picked (remembered on this device).
	// search looks through abelus and every language
	import { onMount } from 'svelte';
	import { Search } from '@lucide/svelte';
	import Tp from '#lib/Tp.svelte';
	import { LANGUAGES, fold } from '#lib/dictionary.js';

	let { data } = $props();

	let query = $state('');
	let language = $state(LANGUAGES[0].code);
	onMount(() => {
		try {
			const saved = localStorage.getItem('dictionary-language');
			if (LANGUAGES.some((l) => l.code === saved)) language = /** @type {string} */ (saved);
		} catch {}
	});
	function pick() {
		try {
			localStorage.setItem('dictionary-language', language);
		} catch {}
	}

	const strip = (/** @type {string} */ t) => fold(t.replace(/<\/?(tp|al)>/g, ''));

	/**
	 * each word with how well it matches (0 exact, 1 starts with, 2 contains) and, for a translation, where
	 * @param {typeof data.words[number]} w @param {string} q
	 */
	function match(w, q) {
		/** @type {{ text: string, lang: string }[]} */
		const candidates = [];
		candidates.push(...[w.title, ...w.forms].map((text) => ({ text, lang: '' })));
		// the picked language first, so its match is the one shown when several match as well
		for (const { code } of [...LANGUAGES].sort((a, b) => +(b.code === language) - +(a.code === language))) {
			candidates.push(...[...(w.translations[code] ?? []), ...(w.formTranslations?.[code] ?? [])].map((text) => ({ text, lang: code })));
		}
		let best = { rank: 3, lang: '', text: '' };
		for (const c of candidates) {
			const t = strip(c.text);
			const rank = t === q ? 0 : t.startsWith(q) ? 1 : t.includes(q) ? 2 : 3;
			if (rank < best.rank) best = { rank, ...c };
		}
		return best;
	}

	const results = $derived.by(() => {
		const q = strip(query.trim());
		if (!q) return data.words.map((w) => ({ w, lang: '', text: '' }));
		return data.words
			.map((w) => ({ w, ...match(w, q) }))
			.filter((r) => r.rank < 3)
			.sort((a, b) => a.rank - b.rank);
	});

	const languageName = (/** @type {string} */ code) => LANGUAGES.find((l) => l.code === code)?.name ?? code;
	// marked as featured in the cms: cards on top, while not searching
	const featured = $derived(data.words.filter((w) => w.featured));
</script>

<svelte:head>
	<title>dictionary — abelus.org</title>
	<meta name="description" content="every abelus word, with its translations." />
</svelte:head>

<main>
	<header>
		<h1>dictionary</h1>
		<p class="lead">{data.words.length} abelus {data.words.length === 1 ? 'word' : 'words'}</p>
	</header>

	<div class="search glass">
		<Search size={18} />
		<input type="text" inputmode="search" enterkeyhint="search" bind:value={query} placeholder="search a word" aria-label="search a word" autocapitalize="off" autocorrect="off" spellcheck="false" />
		<select bind:value={language} onchange={pick} aria-label="translations in">
			{#each LANGUAGES as { code, name } (code)}<option value={code}>{name}</option>{/each}
		</select>
	</div>

	{#if featured.length && !query.trim()}
		<section class="featured" aria-label="featured words">
			{#each featured as w (w.url)}
				<a class="card glass" href={w.url}>
					<span class="word"><Tp text={w.title} /></span>
					{#if w.pos || w.pronunciation}<span class="kind">{[w.pos, w.pronunciation && `/${w.pronunciation}/`].filter(Boolean).join(' · ')}</span>{/if}
					<span class="meaning">{(w.translations[language] ?? []).join(', ') || '—'}</span>
				</a>
			{/each}
		</section>
	{/if}

	{#if results.length}
		<ul>
			{#each results as { w, lang, text } (w.url)}
				<li>
					<a href={w.url}>
						<span class="title"><Tp text={w.title} />{#if w.pos}<small>{w.pos}</small>{/if}</span>
						<span class="about">
							{(w.translations[language] ?? []).join(', ') || '—'}
							{#if lang && lang !== language}<span class="found">{languageName(lang)}: {text}</span>{/if}
						</span>
					</a>
				</li>
			{/each}
		</ul>
	{:else}
		<p class="none">no words found.</p>
	{/if}
</main>

<style>
	main {
		max-width: 42rem;
		margin: 0 auto;
		padding: calc(var(--top) + 7rem) 1.5rem 8rem;
	}

	header {
		text-align: center;
		margin-bottom: 2rem;
	}

	h1 {
		margin: 0;
		font-family: var(--title);
		font-style: italic;
		font-weight: 600;
		font-size: clamp(2.4rem, 6vw, 3.6rem);
	}

	.lead {
		margin: 0.5rem 0 0;
		color: var(--muted);
	}

	.search {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		padding: 0.35rem 0.5rem 0.35rem 1rem;
		border-radius: 999px;
		color: var(--muted);
	}

	.search input {
		flex: 1;
		min-width: 0;
		padding: 0.5rem 0;
		border: 0;
		outline: 0;
		font: inherit;
		font-size: 1.05rem;
		color: var(--fg);
		background: none;
	}

	.search select {
		max-width: 9rem;
		padding: 0.45rem 0.7rem;
		border: 0;
		border-radius: 999px;
		font: inherit;
		font-size: 0.9rem;
		color: var(--fg);
		background: var(--panel);
	}

	.featured {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(10rem, 1fr));
		gap: 0.75rem;
		margin-top: 1.5rem;
	}

	.card {
		display: grid;
		align-content: start;
		color: inherit;
		text-decoration: none;
		gap: 0.3rem;
		padding: 1.1rem 1.2rem;
		border-radius: 1.25rem;
	}

	.card .word {
		font-family: var(--title);
		font-style: italic;
		font-weight: 600;
		font-size: 1.6rem;
		color: var(--accent);
	}

	.card .kind {
		font-size: 0.85rem;
		color: var(--muted);
	}

	ul {
		margin: 1.5rem 0 0;
		padding: 0;
		list-style: none;
	}

	li + li {
		border-top: 1px solid var(--glass-edge);
	}

	li a {
		display: grid;
		grid-template-columns: minmax(6rem, 1fr) 2fr;
		gap: 1rem;
		padding: 0.85rem 0.25rem;
		color: inherit;
		text-decoration: none;
	}

	li a:hover .title {
		color: var(--accent);
	}

	.title {
		font-family: var(--title);
		font-size: 1.2rem;
		font-weight: 600;
	}

	.title small {
		display: block;
		font-family: var(--serif);
		font-style: italic;
		font-weight: normal;
		font-size: 0.85rem;
		color: var(--muted);
	}

	.about {
		color: var(--muted);
		line-height: 1.45;
	}

	.found {
		display: block;
		color: var(--accent);
	}

	.none {
		margin-top: 2rem;
		text-align: center;
		color: var(--muted);
	}
</style>
