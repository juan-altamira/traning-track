import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	const disabled = url.searchParams.get('disabled') === '1';

	if (locals.session && !disabled) {
		throw redirect(302, '/clientes');
	}

	if (disabled && locals.session) {
		await locals.supabase?.auth.signOut();
	}

	return { disabled };
};
