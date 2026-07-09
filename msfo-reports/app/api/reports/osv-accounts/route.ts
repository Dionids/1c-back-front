import { getOSVAccounts } from '@/lib/1c-client';
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const data = await getOSVAccounts(body);
        return Response.json(data);
    } catch (error) {
        return Response.json({ error: 'Ошибка формирования отчёта' }, { status: 500 });
    }
}