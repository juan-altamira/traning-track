<script lang="ts">
	import { WEEK_DAYS, getTargetSets } from '$lib/routines';
	import type { ProgressState, RoutinePlan } from '$lib/types';

	let { data } = $props();

	let plan: RoutinePlan = data.status === 'ok' ? data.plan : ({} as RoutinePlan);
	let progress: ProgressState = $state(
		data.status === 'ok' ? structuredClone(data.progress) : ({} as ProgressState)
	);
	let expanded = $state<Record<string, boolean>>({});
	let saving = $state(false);
	let message = $state('');

	const adjustSets = (dayKey: string, exerciseId: string, delta: number) => {
		const dayPlan = plan[dayKey];
		const exercise = dayPlan.exercises.find((ex) => ex.id === exerciseId);
		if (!exercise) return;

		const target = Math.max(1, getTargetSets(exercise) || 0);
		const current = progress[dayKey]?.exercises?.[exerciseId] ?? 0;
		const nextValue = Math.min(Math.max(current + delta, 0), target);

		progress[dayKey] = {
			...(progress[dayKey] ?? { completed: false, exercises: {} }),
			exercises: { ...(progress[dayKey]?.exercises ?? {}), [exerciseId]: nextValue }
		};

		const allDone = dayPlan.exercises.every((ex) => {
			const t = Math.max(1, getTargetSets(ex) || 0);
			const done = progress[dayKey].exercises?.[ex.id] ?? 0;
			return done >= t;
		});

		progress[dayKey].completed = allDone;
		saveProgress();
	};

	const toggleDayComplete = (dayKey: string) => {
		progress[dayKey] = {
			...(progress[dayKey] ?? { exercises: {} }),
			completed: !progress[dayKey]?.completed
		};
		saveProgress();
	};

	const toggleExpanded = (dayKey: string) => {
		expanded = { ...expanded, [dayKey]: !expanded[dayKey] };
	};

	const saveProgress = async () => {
		saving = true;
		message = '';
		const formData = new FormData();
		formData.set('progress', JSON.stringify(progress));
		const res = await fetch('?/saveProgress', {
			method: 'POST',
			body: formData
		});
		if (!res.ok) {
			message = 'No se pudo guardar. Revisá tu conexión.';
		} else {
			message = 'Progreso guardado';
		}
		saving = false;
	};
</script>

{#if data.status === 'invalid'}
	<section class="mx-auto max-w-xl space-y-3 rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
		<h1 class="text-xl font-semibold text-slate-900">Link inválido</h1>
		<p class="text-sm text-slate-600">Pedile a tu entrenador que te envíe un link nuevo.</p>
	</section>
{:else if data.status === 'disabled'}
	<section class="mx-auto max-w-xl space-y-3 rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
		<h1 class="text-xl font-semibold text-slate-900">Acceso desactivado</h1>
		<p class="text-sm text-slate-600">
			{data.clientName ? `${data.clientName}, ` : ''}consultá a tu entrenador para reactivar tu acceso.
		</p>
	</section>
{:else}
	<section class="legacy-shell">
		<header class="legacy-header">
			<div>
				<p class="eyebrow">Rutina de</p>
				<h1>{data.clientName}</h1>
				<p class="sub">{data.objective ?? 'Entrenamiento semanal'}</p>
				{#if data.last_completed_at}
					<p class="sub small">Última actualización: {new Date(data.last_completed_at).toLocaleString()}</p>
				{/if}
			</div>
		</header>

		<div class="day-grid">
			{#each WEEK_DAYS as day}
				{#if plan[day.key]}
					<article class="day-card {expanded[day.key] ? 'expanded' : ''}">
						<div class="day-header" onclick={() => toggleExpanded(day.key)}>
							<span class="day-title">{day.label}</span>
							{#if progress[day.key]?.completed}
								<span class="day-complete-badge">Día completado</span>
							{/if}
							<span class="arrow">{expanded[day.key] ? '▾' : '▸'}</span>
						</div>
						<div class="day-content">
							{#if plan[day.key].exercises.length === 0}
								<div class="exercise-card">No hay ejercicios configurados para este día.</div>
							{:else}
								{#each plan[day.key].exercises as exercise (exercise.id)}
									<div class="exercise-card">
										<div class="exercise-title">{exercise.name}</div>
										<div class="exercise-desc">{exercise.scheme}</div>
										{#if exercise.note}
											<div class="exercise-note">{exercise.note}</div>
										{/if}
										<div class="exercise-controls">
											<button class="circle-btn" type="button" onclick={() => adjustSets(day.key, exercise.id, -1)}>−</button>
											<div class="exercise-count">
												<div class="count">
													{progress[day.key]?.exercises?.[exercise.id] ?? 0} / {Math.max(1, getTargetSets(exercise) || 0)}
												</div>
												<div class="label">series</div>
											</div>
											<button class="circle-btn" type="button" onclick={() => adjustSets(day.key, exercise.id, 1)}>+</button>
										</div>
									</div>
								{/each}
							{/if}
							<div class="day-footer">
								<button class="toggle-day" type="button" onclick={() => toggleDayComplete(day.key)}>
									{progress[day.key]?.completed ? 'Marcar como pendiente' : 'Marcar día completo'}
								</button>
							</div>
						</div>
					</article>
				{/if}
			{/each}
		</div>

		{#if message}
			<p class="feedback success">{message}</p>
		{:else if saving}
			<p class="feedback muted">Guardando...</p>
		{/if}
	</section>
{/if}

<style>
	:global(body) {
		background: linear-gradient(135deg, #f3f7fb 0%, #eef1f7 100%);
	}
	.legacy-shell {
		max-width: 900px;
		margin: 0 auto;
		padding: 1.5rem;
	}
	.legacy-header {
		background: #0f172a;
		color: #fff;
		padding: 1.5rem;
		border-radius: 16px;
		box-shadow: 0 10px 30px rgba(15, 23, 42, 0.25);
		margin-bottom: 1rem;
	}
	.legacy-header h1 {
		margin: 0;
		font-size: 1.75rem;
	}
	.eyebrow {
		text-transform: uppercase;
		font-size: 0.75rem;
		letter-spacing: 0.08em;
		margin: 0 0 0.25rem 0;
	}
	.sub {
		margin: 0.15rem 0;
		font-size: 0.95rem;
		opacity: 0.85;
	}
	.sub.small {
		font-size: 0.8rem;
	}
	.day-grid {
		display: grid;
		gap: 0.75rem;
	}
	.day-card {
		background: #fff;
		border-radius: 14px;
		border: 1px solid #e2e8f0;
		box-shadow: 0 6px 18px rgba(15, 23, 42, 0.08);
		overflow: hidden;
	}
	.day-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.9rem 1rem;
		cursor: pointer;
		background: #f8fafc;
	}
	.day-title {
		font-weight: 700;
		color: #0f172a;
	}
	.day-complete-badge {
		background: #22c55e1a;
		color: #15803d;
		padding: 0.25rem 0.6rem;
		border-radius: 999px;
		font-size: 0.75rem;
		font-weight: 600;
	}
	.arrow {
		margin-left: auto;
		color: #475569;
	}
	.day-content {
		padding: 0.75rem 1rem 1rem;
		display: grid;
		gap: 0.75rem;
	}
	.exercise-card {
		border: 1px solid #e2e8f0;
		border-radius: 12px;
		padding: 0.75rem;
		background: #fff;
		box-shadow: inset 0 0 0 1px #f8fafc;
	}
	.exercise-title {
		font-weight: 700;
		color: #0f172a;
	}
	.exercise-desc {
		font-size: 0.9rem;
		color: #475569;
		margin-top: 0.2rem;
	}
	.exercise-note {
		font-size: 0.85rem;
		color: #475569;
		margin-top: 0.25rem;
		font-style: italic;
	}
	.exercise-controls {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
		margin-top: 0.65rem;
	}
	.circle-btn {
		width: 42px;
		height: 42px;
		border-radius: 50%;
		border: 1px solid #cbd5e1;
		background: #fff;
		font-size: 1.2rem;
		font-weight: 700;
		color: #0f172a;
		cursor: pointer;
		transition: all 0.15s ease;
	}
	.circle-btn:hover {
		background: #f1f5f9;
	}
	.exercise-count {
		text-align: center;
		min-width: 110px;
	}
	.count {
		font-weight: 700;
		color: #0f172a;
	}
	.label {
		font-size: 0.8rem;
		color: #475569;
	}
	.day-footer {
		display: flex;
		justify-content: flex-end;
	}
	.toggle-day {
		background: #0f172a;
		color: #fff;
		border: none;
		border-radius: 10px;
		padding: 0.55rem 0.9rem;
		cursor: pointer;
		font-weight: 600;
	}
	.feedback {
		margin-top: 1rem;
		padding: 0.75rem 1rem;
		border-radius: 10px;
		text-align: center;
	}
	.feedback.success {
		background: #ecfdf3;
		color: #15803d;
	}
	.feedback.muted {
		background: #f8fafc;
		color: #475569;
	}

	@media (min-width: 768px) {
		.legacy-shell {
			padding: 2rem;
		}
	}
</style>
