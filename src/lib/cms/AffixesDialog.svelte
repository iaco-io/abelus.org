<script>
	// edits the affixes that make a dictionary word's other forms: "-a" adds a to the end (suffix),
	// "a-" to the start (prefix). each word gets one form for every affix of another part of speech
	import { Save, Undo2, Plus, X } from '@lucide/svelte';
	import { PARTS } from '../dictionary.js';

	/**
	 * @typedef {{ affix: string, pos: string }} Affix
	 * @type {{ affixes: Affix[], onsave: (affixes: Affix[]) => Promise<void>, onclose: () => void }}
	 */
	let { affixes, onsave, onclose } = $props();

	// a copy to edit; nothing changes until saved
	let draft = $state(affixes.map((a) => ({ ...a })));
	const valid = (/** @type {string} */ a) => /^-[^-\s]+$|^[^-\s]+-$/.test(a.trim());
	const bad = $derived(draft.some((a) => (a.affix.trim() || a.pos.trim()) && (!valid(a.affix) || !a.pos.trim())));
	let saving = $state(false);

	async function save() {
		saving = true;
		try {
			await onsave(draft.map((a) => ({ affix: a.affix.trim(), pos: a.pos.trim() })).filter((a) => a.affix && a.pos));
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
	<h2>affixes</h2>
	<p class="note">"-a" goes at the end of a word, "a-" at the start. each word gets a form for every part of speech it isn't.</p>
	<div class="rows">
		{#each draft, i}
			<div class="row">
				<input class="affix" class:wrong={draft[i].affix.trim() && !valid(draft[i].affix)} bind:value={draft[i].affix} placeholder="-a" autocapitalize="off" autocorrect="off" spellcheck="false" aria-label="affix" />
				<span>makes</span>
				<input bind:value={draft[i].pos} placeholder="adjective" list="parts" autocapitalize="off" aria-label="part of speech" />
				<button class="icon" aria-label="remove affix" onclick={() => draft.splice(i, 1)}><X size={16} /></button>
			</div>
		{/each}
		<button class="pill add" onclick={() => draft.push({ affix: '', pos: '' })}><Plus size={16} /> affix</button>
	</div>
	<datalist id="parts">
		{#each PARTS as p}<option value={p}></option>{/each}
	</datalist>
	<div class="buttons">
		<button class="pill" aria-label="cancel" title="cancel" onclick={onclose}><Undo2 size={18} /></button>
		<button class="pill primary" aria-label="save" title={bad ? 'each affix needs a - and a part of speech' : 'save'} disabled={saving || bad} onclick={save}>
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
		gap: 0.5rem;
		justify-items: start;
	}

	.row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		width: 100%;
	}

	.row span {
		color: var(--muted);
		font-size: 0.9rem;
	}

	.row input {
		flex: 1;
		min-width: 0;
	}

	.row .affix {
		flex: 0 0 5rem;
		text-align: center;
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

	.wrong {
		outline: 2px solid #c0504d;
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
