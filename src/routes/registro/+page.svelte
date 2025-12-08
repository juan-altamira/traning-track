<script lang="ts">
import { env } from '$env/dynamic/public';
import { supabaseClient } from '$lib/supabaseClient';

let email = '';
let password = '';
let confirmPassword = '';
let message = '';
let error = '';
let loading = false;
let showPassword = false;
let showConfirm = false;
const SITE_URL = (env.PUBLIC_SITE_URL ?? 'http://localhost:5173').replace(/\/?$/, '');

const sendSignUpLink = async () => {
	loading = true;
	error = '';
	message = '';
	if (password !== confirmPassword) {
		error = 'Las contraseñas no coinciden';
		loading = false;
		return;
	}
	const { error: signUpError } = await supabaseClient.auth.signUp({
		email: email.trim(),
		password,
		options: {
			emailRedirectTo: `${SITE_URL}/registro`
		}
	});
		if (signUpError) {
			error = 'No pudimos enviar el link. Revisá el email e intentá de nuevo.';
			console.error(signUpError);
		} else {
			message = 'Revisá tu correo y tocá el link para confirmar tu cuenta.';
		}
		loading = false;
	};
</script>

<section class="mx-auto max-w-lg space-y-6 rounded-2xl border border-slate-800 bg-[#0f111b] p-8 shadow-lg shadow-black/30 text-slate-100">
	<div class="space-y-2 text-center">
		<p class="text-sm font-semibold uppercase tracking-wide text-slate-400">Registro</p>
		<h1 class="text-2xl font-semibold text-slate-50">Crear cuenta de entrenador</h1>
		<p class="text-sm text-slate-400">Ingresá tu email. Te enviamos un link para confirmar.</p>
		<p class="text-xs text-slate-500">¿Ya tenés cuenta? <a class="text-emerald-300 hover:underline" href="/login">Entrá aquí</a></p>
	</div>
	<div class="space-y-4">
		<label class="block text-sm font-medium text-slate-200">
			Email
			<input
				class="mt-1 w-full rounded-lg border border-slate-700 bg-[#151827] px-3 py-2 text-base text-slate-100 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-700"
				placeholder="entrenador@tu-mail.com"
				type="email"
				required
				bind:value={email}
			/>
		</label>
		<label class="block text-sm font-medium text-slate-200">
			Contraseña
			<div class="relative mt-1">
				<input
					class="w-full rounded-lg border border-slate-700 bg-[#151827] px-3 py-2 pr-10 text-base text-slate-100 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-700"
					placeholder="••••••••"
					type={showPassword ? 'text' : 'password'}
					required
					bind:value={password}
				/>
				<button
					type="button"
					class="absolute inset-y-0 right-0 px-3 text-slate-400 hover:text-slate-200"
					on:click={() => (showPassword = !showPassword)}
					aria-label="Mostrar u ocultar contraseña"
				>
					{showPassword ? 'Ocultar' : 'Ver'}
				</button>
			</div>
		</label>
		<label class="block text-sm font-medium text-slate-200">
			Confirmar contraseña
			<div class="relative mt-1">
				<input
					class="w-full rounded-lg border border-slate-700 bg-[#151827] px-3 py-2 pr-10 text-base text-slate-100 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-700"
					placeholder="••••••••"
					type={showConfirm ? 'text' : 'password'}
					required
					bind:value={confirmPassword}
				/>
				<button
					type="button"
					class="absolute inset-y-0 right-0 px-3 text-slate-400 hover:text-slate-200"
					on:click={() => (showConfirm = !showConfirm)}
					aria-label="Mostrar u ocultar contraseña"
				>
					{showConfirm ? 'Ocultar' : 'Ver'}
				</button>
			</div>
		</label>
		<button
			on:click|preventDefault={sendSignUpLink}
			class="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-70"
			disabled={loading || !email || !password || !confirmPassword}
		>
			{#if loading}
				Enviando...
			{:else}
				Enviar link de registro
			{/if}
		</button>
		{#if message}
			<p class="rounded-lg bg-emerald-900/40 px-3 py-2 text-sm text-emerald-200 border border-emerald-700/50">{message}</p>
		{/if}
		{#if error}
			<p class="rounded-lg bg-red-900/40 px-3 py-2 text-sm text-red-200 border border-red-700/50">{error}</p>
		{/if}
	</div>
	<p class="text-xs text-slate-500 text-center">
		Redirect configurado en Supabase: {SITE_URL}/registro
	</p>
</section>
