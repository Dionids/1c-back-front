import { getOSVRentalObjects } from '@/lib/1c-client';
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const data = await getOSVRentalObjects(body);
        return Response.json(data);
    } catch (error) {
        // Детали пишем только в лог сервера, клиенту — чистый 500 без подробностей
        console.error('osv-objects:', error);
        return new Response(null, { status: 500 });
    }
}