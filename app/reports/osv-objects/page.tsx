'use client';

import { useState, useEffect } from 'react';
import dayjs from 'dayjs';

export default function OSVObjectsPage() {
    const [objects, setObjects] = useState<string[]>([]);
    const [dateFrom, setDateFrom] = useState(dayjs().startOf('year').format('YYYY-MM-DD'));
    const [dateTo, setDateTo] = useState(dayjs().format('YYYY-MM-DD'));
    const [selectedObject, setSelectedObject] = useState<string>('');
    const [rows, setRows] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetch('/api/rental-objects')
            .then(r => r.json())
            .then(setObjects);
    }, []);

    async function handleSubmit() {
        setLoading(true);
        const res = await fetch('/api/reports/osv-objects', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                date_from: dayjs(dateFrom).toISOString(),
                date_to: dayjs(dateTo).toISOString(),
                selected_rent_object: selectedObject || null,
            }),
        });
        const data = await res.json();
        setRows(data.rows ?? []);
        setLoading(false);
    }

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

            {rows.length > 0 && (
                <div className="bg-white rounded-lg border overflow-x-auto">
                    <table className="text-sm w-full">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th rowSpan={2} className="px-3 py-2 text-left border-r">Объект аренды</th>
                                <th colSpan={2} className="px-3 py-2 text-center border-r border-b">Стоимость на начало</th>
                                <th colSpan={4} className="px-3 py-2 text-center border-r border-b">Изменение за период</th>
                                <th colSpan={2} className="px-3 py-2 text-center border-b">Стоимость на конец</th>
                            </tr>
                            <tr>
                                <th className="px-3 py-2 text-right border-r">Активы</th>
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
