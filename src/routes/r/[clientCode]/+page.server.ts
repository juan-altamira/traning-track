import { normalizePlan, normalizeProgress, WEEK_DAYS } from '$lib/routines';
import { supabaseAdmin } from '$lib/server/supabaseAdmin';
import type { ProgressState, RoutinePlan } from '$lib/types';
import { error, fail } from '@sveltejs/kit';
import { nowIsoUtc } from '$lib/time';
import type { Actions, PageServerLoad } from './$types';

const fetchClient = async (clientCode: string) => {
	const { data, error: clientError } = await supabaseAdmin
		.from('clients')
		.select('id,name,objective,status,trainer_id')
		.eq('client_code', clientCode)
		.maybeSingle();
	return { data, clientError };
};

export const load: PageServerLoad = async ({ params }) => {
	const clientCode = params.clientCode;
	const { data: client, clientError } = await fetchClient(clientCode);

	if (clientError) {
		console.error(clientError);
		throw error(500, { message: 'No pudimos cargar la rutina' });
	}

	if (!client) {
		return { status: 'invalid' as const };
	}

	const { data: trainer } = await supabaseAdmin
		.from('trainers')
		.select('status')
		.eq('id', client.trainer_id)
		.maybeSingle();

	const trainerInactive = trainer && trainer.status !== 'active';
	const clientInactive = client.status !== 'active';

	if (trainerInactive || clientInactive) {
		return {
			status: 'disabled' as const,
			clientName: client.name
		};
	}

	const { data: routineRow } = await supabaseAdmin
		.from('routines')
		.select('plan')
		.eq('client_id', client.id)
		.maybeSingle();

	let plan = normalizePlan(routineRow?.plan as RoutinePlan | null);
	if (!routineRow) {
		await supabaseAdmin.from('routines').insert({ client_id: client.id, plan });
	}

	const { data: progressRow } = await supabaseAdmin
		.from('progress')
		.select('progress,last_completed_at')
		.eq('client_id', client.id)
		.maybeSingle();

	const progress = normalizeProgress(progressRow?.progress as ProgressState | null);

	if (!progressRow) {
		await supabaseAdmin.from('progress').insert({ client_id: client.id, progress });
	}

	return {
		status: 'ok' as const,
		clientId: client.id,
		clientName: client.name,
		objective: client.objective,
		plan,
		progress,
		last_completed_at: progressRow?.last_completed_at ?? null
	};
};

export const actions: Actions = {
	saveProgress: async ({ request, params }) => {
		const clientCode = params.clientCode;
		const { data: client } = await fetchClient(clientCode);

		if (!client || client.status !== 'active') {
			return fail(403, { message: 'Acceso desactivado' });
		}

		const formData = await request.formData();
		const rawProgress = String(formData.get('progress') || '');

		let parsed: ProgressState;
		try {
			parsed = JSON.parse(rawProgress);
		} catch (e) {
			console.error(e);
			return fail(400, { message: 'Formato inválido' });
		}

		const nowUtc = nowIsoUtc();
		const progress = normalizeProgress(parsed, {
			last_activity_utc: nowUtc,
			last_reset_utc: parsed?._meta?.last_reset_utc ?? null
		});
		const anyCompleted = WEEK_DAYS.some((day) => progress[day.key]?.completed);

		const { error: updateError } = await supabaseAdmin
			.from('progress')
			.update({
				progress,
				last_completed_at: anyCompleted ? nowUtc : null
			})
			.eq('client_id', client.id);

		if (updateError) {
			console.error(updateError);
			return fail(500, { message: 'No pudimos guardar el progreso' });
		}

		return { success: true };
	},
	resetProgress: async ({ params }) => {
		const clientCode = params.clientCode;
		const { data: client } = await fetchClient(clientCode);

		if (!client || client.status !== 'active') {
			return fail(403, { message: 'Acceso desactivado' });
		}

		const nowUtc = nowIsoUtc();
		const cleared = normalizeProgress(null, {
			last_activity_utc: nowUtc,
			last_reset_utc: nowUtc
		});

		const { error: updateError } = await supabaseAdmin
			.from('progress')
			.update({ progress: cleared, last_completed_at: null })
			.eq('client_id', client.id);

		if (updateError) {
			console.error(updateError);
			return fail(500, { message: 'No pudimos reiniciar' });
		}

		return { success: true, progress: cleared };
	}
};
