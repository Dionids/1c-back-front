'use client';

import { useState, useEffect } from 'react';
import dayjs from 'dayjs';

interface CalculationRow {
    rent_object: string;
    document: string;
    period: string;
    payment: number | null;
    liability: number | null;
    asset: number | null;
    interest_expense: number | null;
    depreciation_expense: number | null;
    accumulated_depreciation: number | null;
}

export default function CalculationPage() {
    const [objects, setObjects] = useState<string[]>([]);
    const [selectedObject, setSelectedObject] = useState<string>('');
    const [rows, setRows] = useState<CalculationRow[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetch('/api/rental-objects')
            .then(r => r.json())
            .then(setObjects);
    }, []);

    async function handleSubmit() {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/reports/calculation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    selected_rent_object: selectedObject || null,
                }),
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error ?? 'Ошибка сервера');
            }
            const data = await res.json();
            setRows(data.rows ?? []);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Неизвестная ошибка');
            setRows([]);
        } finally {
            setLoading(false);
        }
    }

    function formatPeriod(value: string): string {
        const d = dayjs(value);
        return d.isValid() ? d.format('DD.MM.YYYY') : value;
    }

    return (
        <div>
            <h1 className="text-xl font-bold text-gray-800 mb-4">Расчёт активов и обязательств</h1>

            <div className="bg-white rounded-lg border p-4 mb-4 flex gap-4 flex-wrap items-end">
                <div>
                    <label className="block text-sm text-gray-600 mb-1">Объект аренды</label>
                    <select value={selectedObject} onChange={e => setSelectedObject(e.target.value)}
                            className="border rounded px-3 py-2 text-sm min-w-48">
                        <option value="">Все объекты</option>
                        {objects.map(obj => <option key={obj} value={obj}>{obj}</option>)}
                    </select>
                </div>
                <button onClick={handleSubmit} disabled={loading}
                        className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 disabled:opacity-50">
                    {loading ? 'Загрузка...' : 'Сформировать'}
                </button>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
                    {error}
                </div>
            )}

            {rows.length > 0 && (
                <div className="bg-white rounded-lg border overflow-x-auto">
                    <table className="text-sm w-full">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="px-3 py-2 text-left">Объект</th>
                                <th className="px-3 py-2 text-left">Документ</th>
                                <th className="px-3 py-2 text-left">Период</th>
                                <th className="px-3 py-2 text-right">Арендный платёж</th>
                                <th className="px-3 py-2 text-right">Фин. обязательство</th>
                                <th className="px-3 py-2 text-right">Актив</th>
                                <th className="px-3 py-2 text-right">Проц. расход</th>
                                <th className="px-3 py-2 text-right">Расход по аморт.</th>
                                <th className="px-3 py-2 text-right">Накопл. аморт.</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row, i) => (
                                <tr key={i} className="border-b hover:bg-gray-50">
                                    <td className="px-3 py-2">{row.rent_object}</td>
                                    <td className="px-3 py-2">{row.document}</td>
                                    <td className="px-3 py-2">{formatPeriod(row.period)}</td>
                                    <td className="px-3 py-2 text-right">{fmt(row.payment)}</td>
                                    <td className="px-3 py-2 text-right">{fmt(row.liability)}</td>
                                    <td className="px-3 py-2 text-right">{fmt(row.asset)}</td>
                                    <td className="px-3 py-2 text-right">{fmt(row.interest_expense)}</td>
                                    <td className="px-3 py-2 text-right">{fmt(row.depreciation_expense)}</td>
                                    <td className="px-3 py-2 text-right">{fmt(row.accumulated_depreciation)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

function fmt(value: number | null) {
    if (value === null || value === 0) return '—';
    return new Intl.NumberFormat('ru-RU', { minimumFractionDigits: 2 }).format(value);
}
