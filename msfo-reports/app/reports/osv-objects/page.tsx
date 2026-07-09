'use client';

import { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import ObjectSelect from '@/components/ObjectSelect';

interface OsvObjectRow {
    rent_object: string;
    opening_assets: number | null;
    opening_liabilities: number | null;
    change_assets_debit: number | null;
    change_assets_credit: number | null;
    change_liabilities_debit: number | null;
    change_liabilities_credit: number | null;
    closing_assets: number | null;
    closing_liabilities: number | null;
}

const NUMERIC_FIELDS: (keyof OsvObjectRow)[] = [
    'opening_assets',
    'opening_liabilities',
    'change_assets_debit',
    'change_assets_credit',
    'change_liabilities_debit',
    'change_liabilities_credit',
    'closing_assets',
    'closing_liabilities',
];

export default function OSVObjectsPage() {
    const [objects, setObjects] = useState<string[]>([]);
    const [objectsLoading, setObjectsLoading] = useState(true);
    const [dateFrom, setDateFrom] = useState(dayjs().startOf('year').format('YYYY-MM-DD'));
    const [dateTo, setDateTo] = useState(dayjs().format('YYYY-MM-DD'));
    const [selectedObject, setSelectedObject] = useState<string>('');
    const [rows, setRows] = useState<OsvObjectRow[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searched, setSearched] = useState(false);

    useEffect(() => {
        let cancelled = false;
        setObjectsLoading(true);
        fetch('/api/rental-objects')
            .then(r => r.json())
            .then((data: unknown) => {
                if (cancelled) return;
                setObjects(Array.isArray(data) ? (data as string[]) : []);
            })
            .catch(() => { if (!cancelled) setObjects([]); })
            .finally(() => { if (!cancelled) setObjectsLoading(false); });
        return () => { cancelled = true; };
    }, []);

    async function handleSubmit() {
        setLoading(true);
        setError(null);
        setSearched(false);
        try {
            const res = await fetch('/api/reports/osv-objects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    date_from: dayjs(dateFrom).toISOString(),
                    date_to: dayjs(dateTo).toISOString(),
                    selected_rent_object: selectedObject || null,
                }),
            });
            if (!res.ok) {
                throw new Error('Не удалось сформировать отчёт. Попробуйте позже.');
            }
            const data = await res.json();
            setRows(data.rows ?? []);
            setSearched(true);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Неизвестная ошибка');
            setRows([]);
        } finally {
            setLoading(false);
        }
    }

    const totals = sumRows(rows);

    return (
        <div>
            <h1 className="text-xl font-bold text-gray-800 mb-4">ОСВ объектов аренды</h1>

            <div className="bg-white rounded-lg border p-4 mb-4 flex gap-4 flex-wrap items-end">
                <div>
                    <label className="block text-sm text-gray-600 mb-1">С</label>
                    <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                           className="border rounded px-3 py-2 text-sm" />
                </div>
                <div>
                    <label className="block text-sm text-gray-600 mb-1">По</label>
                    <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                           className="border rounded px-3 py-2 text-sm" />
                </div>
                <div className="min-w-64">
                    <label className="block text-sm text-gray-600 mb-1">Объект аренды</label>
                    <ObjectSelect
                        objects={objects}
                        loading={objectsLoading}
                        value={selectedObject}
                        onChange={setSelectedObject}
                    />
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

            {searched && !loading && !error && rows.length === 0 && (
                <div className="bg-white rounded-lg border p-6 text-center text-gray-500 text-sm">
                    Нет данных по выбранным параметрам.
                </div>
            )}

            {rows.length > 0 && (
                <div className="bg-white rounded-lg border overflow-x-auto">
                    <table className="text-sm w-full">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th rowSpan={2} className="px-3 py-2 text-left border-r align-bottom">Объект аренды</th>
                                <th colSpan={2} className="px-3 py-2 text-center border-r border-b">Стоимость на начало</th>
                                <th colSpan={4} className="px-3 py-2 text-center border-r border-b">Изменение за период</th>
                                <th colSpan={2} className="px-3 py-2 text-center border-b">Стоимость на конец</th>
                            </tr>
                            <tr>
                                <th className="px-3 py-2 text-right">Активы</th>
                                <th className="px-3 py-2 text-right border-r">Обязательства</th>
                                <th className="px-3 py-2 text-right">Активы Дт</th>
                                <th className="px-3 py-2 text-right">Активы Кт</th>
                                <th className="px-3 py-2 text-right">Обяз. Дт</th>
                                <th className="px-3 py-2 text-right border-r">Обяз. Кт</th>
                                <th className="px-3 py-2 text-right">Активы</th>
                                <th className="px-3 py-2 text-right">Обязательства</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row, i) => (
                                <tr key={i} className="border-b hover:bg-gray-50">
                                    <td className="px-3 py-2 border-r">{row.rent_object}</td>
                                    <td className="px-3 py-2 text-right">{fmt(row.opening_assets)}</td>
                                    <td className="px-3 py-2 text-right border-r">{fmt(row.opening_liabilities)}</td>
                                    <td className="px-3 py-2 text-right">{fmt(row.change_assets_debit)}</td>
                                    <td className="px-3 py-2 text-right">{fmt(row.change_assets_credit)}</td>
                                    <td className="px-3 py-2 text-right">{fmt(row.change_liabilities_debit)}</td>
                                    <td className="px-3 py-2 text-right border-r">{fmt(row.change_liabilities_credit)}</td>
                                    <td className="px-3 py-2 text-right">{fmt(row.closing_assets)}</td>
                                    <td className="px-3 py-2 text-right">{fmt(row.closing_liabilities)}</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="bg-gray-100 border-t-2 font-semibold">
                            <tr>
                                <td className="px-3 py-2 border-r">Итого</td>
                                <td className="px-3 py-2 text-right">{fmt(totals.opening_assets)}</td>
                                <td className="px-3 py-2 text-right border-r">{fmt(totals.opening_liabilities)}</td>
                                <td className="px-3 py-2 text-right">{fmt(totals.change_assets_debit)}</td>
                                <td className="px-3 py-2 text-right">{fmt(totals.change_assets_credit)}</td>
                                <td className="px-3 py-2 text-right">{fmt(totals.change_liabilities_debit)}</td>
                                <td className="px-3 py-2 text-right border-r">{fmt(totals.change_liabilities_credit)}</td>
                                <td className="px-3 py-2 text-right">{fmt(totals.closing_assets)}</td>
                                <td className="px-3 py-2 text-right">{fmt(totals.closing_liabilities)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            )}
        </div>
    );
}

function sumRows(rows: OsvObjectRow[]): Record<string, number> {
    const acc: Record<string, number> = {};
    for (const f of NUMERIC_FIELDS) acc[f] = 0;
    for (const row of rows) {
        for (const f of NUMERIC_FIELDS) {
            acc[f] += (row[f] as number | null) ?? 0;
        }
    }
    return acc;
}

function fmt(value: number | null) {
    if (value === null || value === 0) return '—';
    return new Intl.NumberFormat('ru-RU', { minimumFractionDigits: 2 }).format(value);
}