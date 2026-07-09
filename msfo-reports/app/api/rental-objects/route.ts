import { getRentalObjects } from '@/lib/1c-client';

export async function GET() {
    try {
        const data = await getRentalObjects();
        // Всегда возвращаем массив, чтобы клиент мог безопасно делать .map()
        return Response.json(Array.isArray(data) ? data : []);
    } catch (error) {
        console.error('rental-objects:', error);
        // Возвращаем пустой массив со статусом 200, чтобы выпадающий список
        // на страницах отчётов не ломался при недоступности 1С.
        return Response.json([]);
    }
}