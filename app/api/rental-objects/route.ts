import { getRentalObjects } from '@/lib/1c-client';

export async function GET() {
    try {
        const data = await getRentalObjects();
        return Response.json(data);
    } catch (error) {
        return Response.json({ error: 'Ошибка получения объектов аренды' }, { status: 500 });
    }
}