<script>
	// a dictionary word's details, under its title: part of speech, pronunciation, translations, forms, examples
	import Tp from './Tp.svelte';
	import { slug } from './dictionary.js';

	/** @type {{ word: ReturnType<typeof import('./dictionary.js').wordInfo> }} */
	let { word } = $props();
</script>

<section class="word">
	{#if word.pos || word.pronunciation}
		<p class="kind">
			{#if word.pos}<em>{word.pos}</em>{/if}
			{#if word.pronunciation}<span>/{word.pronunciation}/</span>{/if}
		</p>
	{/if}

	{#if word.translations.length}
		<dl class="glass">
			{#each word.translations as { code, name, words } (code)}
				<dt>{name}</dt>
				<dd lang={code}>{words.join(', ')}</dd>
			{/each}
		</dl>
	{/if}

	{#if word.forms.length}
		<h2>forms</h2>
		<dl class="glass">
			{#each word.forms as { pos, form, translations }}
				<dt>{pos}</dt>
				<dd>
					{form}
					{#if translations?.length}
						<small>{translations.map((t) => `${t.name}: ${t.words.join(', ')}`).join(' · ')}</small>
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
