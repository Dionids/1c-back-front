import { getCalculation } from '@/lib/1c-client';
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const data = await getCalculation(body);
        return Response.json(data);
    } catch (error) {
        console.error('calculation:', error);
        return new Response(null, { status: 500 });
    }
}