<script>
	// edits the affixes that make a dictionary word's other forms: a prefix goes before the word, a suffix after it.
	// spaces are kept ("a " makes "a word", a separate particle); a hyphen on the word's side means attached.
	// each word gets one form for every affix of another part of speech, in the order they have here
	import { Save, Undo2, Plus, X, ChevronUp, ChevronDown } from '@lucide/svelte';
	import { PARTS, typeOf, attach } from '../dictionary.js';

	/**
	 * @typedef {import('../dictionary.js').Affix} Affix
	 * @type {{ affixes: Affix[], onsave: (affixes: Affix[]) => Promise<void>, onclose: () => void }}
	 */
	let { affixes, onsave, onclose } = $props();

	// a copy to edit; nothing changes until saved
	let draft = $state(affixes.map((a) => ({ ...a, type: typeOf(a) })));
	// an affix needs a letter, and a part of speech
	const filled = (/** @type {Affix} */ a) => !!a.affix.replace(/[-\s]/g, '');
	const bad = $derived(draft.some((a) => (filled(a) || a.pos.trim()) && (!filled(a) || !a.pos.trim())));

	function move(/** @type {number} */ i, /** @type {number} */ step) {
		const j = i + step;
		if (j < 0 || j >= draft.length) return;
		[draft[i], draft[j]] = [draft[j], draft[i]];
	}

	// typing a leading - or space makes it a suffix, a trailing one a prefix
	function typed(/** @type {Affix} */ a) {
		if (/^[-\s]/.test(a.affix)) a.type = 'suffix';
		else if (/[-\s]$/.test(a.affix)) a.type = 'prefix';
	}
	let saving = $state(false);

	async function save() {
		saving = true;
		try {
			// the affix as typed, spaces and all
			await onsave(draft.filter((a) => filled(a) && a.pos.trim()).map((a) => ({ affix: a.affix, pos: a.pos.trim(), type: a.type })));
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
	<p class="note">a prefix goes before the word, a suffix after it. with a space it stays a separate particle; with a hyphen, or nothing, it's attached. each word gets a form for every part of speech it isn't.</p>
	<div class="rows">
		{#each draft, i}
			{@const a = draft[i]}
			<div class="affix-card">
				<div class="row">
					<div class="type" role="radiogroup" aria-label="prefix or suffix">
						{#each /** @type {const} */ (['prefix', 'suffix']) as t}
							<button role="radio" aria-checked={a.type === t} class:on={a.type === t} onclick={() => (a.type = t)}>{t}</button>
						{/each}
					</div>
					<input class="affix" bind:value={a.affix} oninput={() => typed(a)} placeholder={a.type === 'prefix' ? 'a-' : '-a'} autocapitalize="off" autocorrect="off" spellcheck="false" aria-label="affix" />
					<small class="sample">{filled(a) ? `“${attach(a, 'abel')}”` : ''}</small>
					<button class="icon" aria-label="remove affix" onclick={() => draft.splice(i, 1)}><X size={16} /></button>
				</div>
				<div class="row">
					<span>makes</span>
					<input bind:value={a.pos} placeholder="adjective" list="parts" autocapitalize="off" aria-label="part of speech" />
					<button class="icon" aria-label="move up" title="move up" disabled={i === 0} onclick={() => move(i, -1)}><ChevronUp size={18} /></button>
					<button class="icon" aria-label="move down" title="move down" disabled={i === draft.length - 1} onclick={() => move(i, 1)}><ChevronDown size={18} /></button>
				</div>
			</div>
		{/each}
		<button class="pill add" onclick={() => draft.push({ affix: '', pos: '', type: 'suffix' })}><Plus size={16} /> affix</button>
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
		gap: 0.6rem;
		justify-items: start;
	}

	.affix-card {
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
		flex: 0 0 4.2rem;
		text-align: center;
		white-space: pre;
	}

	.type {
		display: flex;
		flex: none;
		padding: 0.2rem;
		border-radius: 999px;
		background: var(--panel);
	}

	.type button {
		padding: 0.35rem 0.5rem;
		border: 0;
		border-radius: 999px;
		font: inherit;
		font-size: 0.78rem;
		color: var(--muted);
		background: none;
		cursor: pointer;
	}

	.type button.on {
		color: var(--fg);
		background: var(--bg);
		box-shadow: 0 0 6px var(--shadow-soft);
	}

	.sample {
		flex: 1;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		font-size: 0.85rem;
		color: var(--muted);
		white-space: pre;
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

	.icon:disabled {
		opacity: 0.3;
		cursor: default;
	}

	.add {
		height: auto;
		padding: 0.7rem 1rem;
		box-shadow: none;
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
