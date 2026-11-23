<script>
	// edits the phonotactics: letter groups (each kept anywhere, to the middle of words, or to their end) and the
	// syllable they make, like "(I / C₁ C₂) V (M / F)". a word to try shows the result as it's edited
	import { Save, Undo2, Plus, X } from '@lucide/svelte';
	import { syllables, check } from '../phonotactics.js';

	/**
	 * @typedef {import('../phonotactics.js').Rules} Rules
	 * @type {{ rules: Rules, onsave: (rules: Rules) => Promise<void>, onclose: () => void }}
	 */
	let { rules, onsave, onclose } = $props();

	// a copy to edit; nothing changes until saved
	let draft = $state(/** @type {Rules} */ ({ groups: rules.groups.map((g) => ({ ...g })), syllable: rules.syllable }));
	let sample = $state('');
	let saving = $state(false);

	const clean = () => ({
		groups: draft.groups
			.map((g) => ({ name: g.name.trim(), letters: g.letters.trim().split(/[\s,]+/).filter(Boolean).join(' '), where: g.where }))
			.filter((g) => g.name),
		syllable: draft.syllable.trim()
	});
	// what's wrong with the syllable, if anything
	const problem = $derived.by(() => {
		const { groups, syllable } = clean();
		const names = groups.map((g) => g.name);
		if (new Set(names).size < names.length) return 'two groups have the same name';
		if (!syllable) return '';
		try {
			syllables(syllable, names);
			return '';
		} catch (err) {
			return /** @type {Error} */ (err).message;
		}
	});
	const tried = $derived(problem || !sample.trim() ? null : check(sample, clean()));

	async function save() {
		saving = true;
		try {
			await onsave(clean());
		} finally {
			saving = false;
		}
	}

	/** @type {HTMLDialogElement | undefined} */
	let dialog = $state();
	$effect(() => dialog?.showModal());

	function outside(/** @type {MouseEvent} */ e) {
		if (e.target !== dialog || !dialog) return;
		const r = dialog.getBoundingClientRect();
		if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) onclose();
	}
</script>

<dialog bind:this={dialog} class="glass" oncancel={(e) => (e.preventDefault(), onclose())} onclick={outside}>
	<h2>phonotactics</h2>
	<p class="note">letter groups, then the syllable they make. a word is one or more syllables in a row.</p>

	<div class="rows">
		{#each draft.groups, i}
			{@const g = draft.groups[i]}
			<div class="card">
				<div class="row">
					<input class="name" bind:value={g.name} placeholder="V" autocapitalize="off" autocorrect="off" spellcheck="false" aria-label="group name" />
					<input bind:value={g.letters} placeholder="a e i o u" autocapitalize="off" autocorrect="off" spellcheck="false" aria-label="letters" />
					<button class="icon" aria-label="remove group" onclick={() => draft.groups.splice(i, 1)}><X size={16} /></button>
				</div>
				<div class="where" role="radiogroup" aria-label="where in a word">
					{#each /** @type {const} */ ([['anywhere', 'anywhere'], ['middle', 'mid-word only'], ['end', 'word end only']]) as [w, label]}
						<button role="radio" aria-checked={g.where === w} class:on={g.where === w} onclick={() => (g.where = w)}>{label}</button>
					{/each}
				</div>
			</div>
		{/each}
		<button class="pill add" onclick={() => draft.groups.push({ name: '', letters: '', where: 'anywhere' })}><Plus size={16} /> group</button>
	</div>

	<label class="field">
		<span>syllable · ( a / b c ) is optional, one of them</span>
		<input bind:value={draft.syllable} placeholder="(I / C₁ C₂) V (M / F)" autocapitalize="off" autocorrect="off" spellcheck="false" />
	</label>
	{#if problem}<small class="bad">{problem}</small>{/if}

	<label class="field">
		<span>try a word</span>
		<input bind:value={sample} placeholder="lapas" autocapitalize="off" autocorrect="off" spellcheck="false" />
	</label>
	{#if tried}
		<small class:bad={!tried.ok} class="result">
			{tried.ok ? '✓' : '✗'} {tried.shown}{#if tried.unknown.length}{' · '}not in any group: {tried.unknown.join(' ')}{/if}
		</small>
	{/if}

	<div class="buttons">
		<button class="pill" aria-label="cancel" title="cancel" onclick={onclose}><Undo2 size={18} /></button>
		<button class="pill primary" aria-label="save" title="save" disabled={saving || !!problem} onclick={save}>
			<Save size={18} class={saving ? 'pulse' : ''} />
		</button>
	</div>
</dialog>

<style>
	dialog {
		width: min(30rem, calc(100vw - 2rem));
		max-height: calc(100dvh - 3rem);
		padding: 1.1rem;
		border-radius: 1.5rem;
		color: var(--fg);
		background: color-mix(in srgb, var(--bg) 88%, transparent);
	}

	dialog::backdrop {
		background: rgb(0 0 0 / 0.3);
		-webkit-backdrop-filter: blur(4px);
		backdrop-filter: blur(4px);
	}

	h2 {
		margin: 0 0 0.3rem;
		font-size: 1.2rem;
	}

	.note {
		margin: 0 0 1rem;
		font-size: 0.9rem;
		color: var(--muted);
	}

	.rows {
		display: grid;
		gap: 0.6rem;
		justify-items: start;
	}

	.card {
		display: grid;
		gap: 0.45rem;
		width: 100%;
		padding: 0.5rem;
		border-radius: 1rem;
		background: color-mix(in srgb, var(--bg) 60%, transparent);
	}

	.row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.row input {
		flex: 1;
		min-width: 0;
	}

	.row .name {
		flex: 0 0 3.6rem;
		text-align: center;
	}

	.where {
		display: flex;
		justify-self: start;
		padding: 0.2rem;
		border-radius: 999px;
		background: var(--panel);
	}

	.where button {
		padding: 0.35rem 0.6rem;
		border: 0;
		border-radius: 999px;
		font: inherit;
		font-size: 0.78rem;
		color: var(--muted);
		background: none;
		cursor: pointer;
	}

	.where button.on {
		color: var(--fg);
		background: var(--bg);
		box-shadow: 0 0 6px var(--shadow-soft);
	}

	.icon {
		display: flex;
		padding: 0.3rem;
		border: 0;
		border-radius: 999px;
		color: var(--muted);
		background: none;
		cursor: pointer;
	}

	.add {
		height: auto;
		padding: 0.7rem 1rem;
		box-shadow: none;
	}

	.field {
		display: grid;
		gap: 0.35rem;
		margin-top: 1rem;
	}

	.field span {
		font-size: 0.85rem;
		color: var(--muted);
	}

	small {
		display: block;
		margin-top: 0.4rem;
		font-size: 0.9rem;
	}

	.result {
		color: var(--accent);
	}

	.bad {
		color: #c0504d;
	}

	.buttons {
		display: flex;
		justify-content: flex-end;
		gap: 0.6rem;
		margin-top: 1rem;
	}

	.buttons .pill {
		min-width: 3.75rem;
		box-shadow: none;
	}
</style>
