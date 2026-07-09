'use client';

import { useState, useEffect } from 'react';
import dayjs from 'dayjs';

interface OsvAccountRow {
    account_code: string;
    account_name: string;
    rent_object: string;
    opening_debit: number | null;
    opening_credit: number | null;
    turnover_debit: number | null;
    turnover_credit: number | null;
    closing_debit: number | null;
    closing_credit: number | null;
}

export default function OSVAccountsPage() {
    const [objects, setObjects] = useState<string[]>([]);
    const [dateFrom, setDateFrom] = useState(dayjs().startOf('year').format('YYYY-MM-DD'));
    const [dateTo, setDateTo] = useState(dayjs().format('YYYY-MM-DD'));
    const [selectedObjects, setSelectedObjects] = useState<string[]>([]);
    const [rows, setRows] = useState<OsvAccountRow[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetch('/api/rental-objects')
            .then(r => r.json())
            .then(setObjects);
    }, []);

    function toggleObject(obj: string) {
        setSelectedObjects(prev =>
            prev.includes(obj) ? prev.filter(o => o !== obj) : [...prev, obj]
        );
    }

    async function handleSubmit() {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/reports/osv-accounts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    date_from: dayjs(dateFrom).toISOString(),
                    date_to: dayjs(dateTo).toISOString(),
                    selected_rent_objects: selectedObjects.length > 0 ? selectedObjects : null,
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

    return (
        <div>
            <h1 className="text-xl font-bold text-gray-800 mb-4">ОСВ по счетам</h1>

            <div className="bg-white rounded-lg border p-4 mb-4">
                <div className="flex gap-4 flex-wrap items-end mb-4">
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
                    <button onClick={handleSubmit} disabled={loading}
                            className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 disabled:opacity-50">
                        {loading ? 'Загрузка...' : 'Сформировать'}
                    </button>
                </div>
                <div>
                    <label className="block text-sm text-gray-600 mb-2">Объекты аренды (не выбрано — все)</label>
                    <div className="flex flex-wrap gap-2">
                        {objects.map(obj => (
                            <button key={obj} onClick={() => toggleObject(obj)}
                                    className={`px-3 py-1 rounded text-sm border transition-colors ${
                                        selectedObjects.includes(obj)
                                            ? 'bg-blue-600 text-white border-blue-600'
                                            : 'bg-white text-gray-700 hover:border-blue-400'
                                    }`}>
                                {obj}
                            </button>
                        ))}
                    </div>
                </div>
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
                                <th className="px-3 py-2 text-left">Счёт</th>
                                <th className="px-3 py-2 text-left">Наименование</th>
                                <th className="px-3 py-2 text-left">Объект</th>
                                <th className="px-3 py-2 text-right">Нач. Дт</th>
                                <th className="px-3 py-2 text-right">Нач. Кт</th>
                                <th className="px-3 py-2 text-right">Об. Дт</th>
                                <th className="px-3 py-2 text-right">Об. Кт</th>
                                <th className="px-3 py-2 text-right">Кон. Дт</th>
                                <th className="px-3 py-2 text-right">Кон. Кт</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row, i) => (
                                <tr key={i} className="border-b hover:bg-gray-50">
                                    <td className="px-3 py-2 font-mono">{row.account_code}</td>
                                    <td className="px-3 py-2">{row.account_name}</td>
                                    <td className="px-3 py-2">{row.rent_object}</td>
                                    <td className="px-3 py-2 text-right">{fmt(row.opening_debit)}</td>
                                    <td className="px-3 py-2 text-right">{fmt(row.opening_credit)}</td>
                                    <td className="px-3 py-2 text-right">{fmt(row.turnover_debit)}</td>
                                    <td className="px-3 py-2 text-right">{fmt(row.turnover_credit)}</td>
                                    <td className="px-3 py-2 text-right">{fmt(row.closing_debit)}</td>
                                    <td className="px-3 py-2 text-right">{fmt(row.closing_credit)}</td>
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
