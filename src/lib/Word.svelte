<script>
	// a dictionary word's details, under its title: part of speech, pronunciation, translations, forms, examples
	// language chips under the title show or hide each language's translations. at first: esperanto and the
	// languages the browser is set to (english and esperanto if it has none of them); then as picked, kept on
	// this device for every word
	import { onMount } from 'svelte';
	import Tp from './Tp.svelte';
	import { slug, LANGUAGES } from './dictionary.js';

	/** @type {{ word: ReturnType<typeof import('./dictionary.js').wordInfo> }} */
	let { word } = $props();

	const KEY = 'word-languages';
	// the languages this word has translations in, for itself or its forms
	const available = $derived(
		LANGUAGES.filter((l) => word.translations.some((t) => t.code === l.code) || word.forms.some((f) => f.translations?.some((t) => t.code === l.code)))
	);
	let on = $state(/** @type {string[]} */ (['eo', 'en']));

	onMount(() => {
		try {
			const saved = JSON.parse(localStorage.getItem(KEY) ?? 'null');
			if (Array.isArray(saved)) return void (on = saved);
		} catch {}
		// the browser's languages, as codes here: pt-BR is pt, nb and nn are norwegian (no)
		const mine = navigator.languages.map((l) => l.toLowerCase().split('-')[0]).map((l) => (l === 'nb' || l === 'nn' ? 'no' : l));
		const known = LANGUAGES.map((l) => l.code).filter((c) => c !== 'eo' && mine.includes(c));
		on = ['eo', ...(known.length ? known : ['en'])];
	});

	function toggle(/** @type {string} */ code) {
		on = on.includes(code) ? on.filter((c) => c !== code) : [...on, code];
		try {
			localStorage.setItem(KEY, JSON.stringify(on));
		} catch {}
	}

	const translations = $derived(word.translations.filter((t) => on.includes(t.code)));
</script>

<section class="word">
	{#if available.length}
		<div class="langs" role="group" aria-label="translations shown">
			{#each available as { code, name } (code)}
				<button class:on={on.includes(code)} aria-pressed={on.includes(code)} title={name} onclick={() => toggle(code)}>{code}</button>
			{/each}
		</div>
	{/if}

	{#if word.pos || word.pronunciation}
		<p class="kind">
			{#if word.pos}<em>{word.pos}</em>{/if}
			{#if word.pronunciation}<span>/{word.pronunciation}/</span>{/if}
		</p>
	{/if}

	{#if translations.length}
		<dl class="glass">
			{#each translations as { code, name, words } (code)}
				<dt>{name}</dt>
				<dd lang={code}>{words.join(', ')}</dd>
			{/each}
		</dl>
	{/if}

	{#if word.forms.length}
		<h2>forms</h2>
		<dl class="glass">
			{#each word.forms as { pos, form, translations }}
				{@const shown = (translations ?? []).filter((t) => on.includes(t.code))}
				<dt>{pos}</dt>
				<dd>
					{form}
					{#if shown.length}
						<small>{shown.map((t) => `${t.name}: ${t.words.join(', ')}`).join(' · ')}</small>
					{/if}
				</dd>
			{/each}
		</dl>
	{/if}

	{#if word.examples.length}
		<h2>examples</h2>
		<ul class="examples">
			{#each word.examples as example}<li><Tp text={example} /></li>{/each}
		</ul>
	{/if}

	{#if word.related.length}
		<h2>related</h2>
		<p class="related">
			{#each word.related as w, i}{#if i}, {/if}<a href="/{slug(w)}/">{w}</a>{/each}
		</p>
	{/if}
</section>

<style>
	.word {
		margin: -1rem 0 2.5rem;
	}

	.langs {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 0.4rem;
		margin: 0 0 1rem;
	}

	.langs button {
		min-width: 2.4rem;
		padding: 0.25rem 0.6rem;
		border: 1px solid var(--glass-edge);
		border-radius: 999px;
		font: inherit;
		font-size: 0.8rem;
		font-weight: 600;
		letter-spacing: 0.04em;
		color: var(--muted);
		background: none;
		cursor: pointer;
	}

	.langs button.on {
		color: var(--bg);
		background: var(--accent);
		border-color: var(--accent);
	}

	.kind {
		display: flex;
		justify-content: center;
		gap: 0.8rem;
		margin: 0 0 1.5rem;
		color: var(--muted);
	}

	.kind em {
		color: var(--accent);
	}

	h2 {
		margin: 1.75rem 0 0.6rem;
		font-family: var(--title);
		font-style: italic;
		font-weight: 600;
		font-size: 1.3rem;
	}

	dl {
		display: grid;
		grid-template-columns: max-content 1fr;
		gap: 0.45rem 1.25rem;
		margin: 0;
		padding: 1rem 1.25rem;
		border-radius: 1.25rem;
	}

	dt {
		color: var(--muted);
	}

	dd {
		margin: 0;
	}

	dd small {
		display: block;
		font-size: 0.85rem;
		color: var(--muted);
	}

	.examples {
		margin: 0;
		padding-left: 1.2rem;
		line-height: 1.6;
	}

	.related a {
		color: var(--accent);
	}
</style>
