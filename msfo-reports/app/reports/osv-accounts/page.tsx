'use client';

import { useState, useEffect, Fragment } from 'react';
import dayjs from 'dayjs';
import ObjectSelect from '@/components/ObjectSelect';

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

interface AccountGroup {
    account_code: string;
    account_name: string;
    rows: OsvAccountRow[];
    subtotal: Totals;
}

interface Totals {
    opening_debit: number;
    opening_credit: number;
    turnover_debit: number;
    turnover_credit: number;
    closing_debit: number;
    closing_credit: number;
}

const NUMERIC_FIELDS: (keyof Totals)[] = [
    'opening_debit',
    'opening_credit',
    'turnover_debit',
    'turnover_credit',
    'closing_debit',
    'closing_credit',
];

const COL_COUNT = 7;

export default function OSVAccountsPage() {
    const [objects, setObjects] = useState<string[]>([]);
    const [objectsLoading, setObjectsLoading] = useState(true);
    const [dateFrom, setDateFrom] = useState(dayjs().startOf('year').format('YYYY-MM-DD'));
    const [dateTo, setDateTo] = useState(dayjs().format('YYYY-MM-DD'));
    const [selectedObjects, setSelectedObjects] = useState<string[]>([]);
    const [rows, setRows] = useState<OsvAccountRow[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

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

    const groups = groupByAccount(rows);
    const grandTotal = sumTotals(groups.map(g => g.subtotal));

    return (
        <div>
            <h1 className="text-xl font-bold text-gray-800 mb-4">ОСВ по счетам</h1>

            <div className="bg-white rounded-lg border p-4 mb-4">
                <div className="flex gap-4 flex-wrap items-end">
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
                        <label className="block text-sm text-gray-600 mb-1">Объекты аренды (не выбрано — все)</label>
                        <ObjectSelect
                            multiple
                            objects={objects}
                            loading={objectsLoading}
                            value={selectedObjects}
                            onChange={setSelectedObjects}
                        />
                    </div>
                    <button onClick={handleSubmit} disabled={loading}
                            className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 disabled:opacity-50">
                        {loading ? 'Загрузка...' : 'Сформировать'}
                    </button>
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
                                <th rowSpan={2} className="px-3 py-2 text-left border-r align-bottom">Счёт / Объект аренды</th>
                                <th colSpan={2} className="px-3 py-2 text-center border-r border-b">Сальдо на начало периода</th>
                                <th colSpan={2} className="px-3 py-2 text-center border-r border-b">Оборот за период</th>
                                <th colSpan={2} className="px-3 py-2 text-center border-b">Сальдо на конец периода</th>
                            </tr>
                            <tr>
                                <th className="px-3 py-2 text-right">Дебет</th>
                                <th className="px-3 py-2 text-right border-r">Кредит</th>
                                <th className="px-3 py-2 text-right">Дебет</th>
                                <th className="px-3 py-2 text-right border-r">Кредит</th>
                                <th className="px-3 py-2 text-right">Дебет</th>
                                <th className="px-3 py-2 text-right">Кредит</th>
                            </tr>
                        </thead>
                        <tbody>
                            {groups.map((grp) => (
                                <Fragment key={grp.account_code}>
                                    <tr className="bg-blue-50 border-b font-semibold">
                                        <td className="px-3 py-2 border-r">
                                            <span className="font-mono mr-2">{grp.account_code}</span>
                                            {grp.account_name}
                                        </td>
                                        <td className="px-3 py-2 text-right">{fmt(grp.subtotal.opening_debit)}</td>
                                        <td className="px-3 py-2 text-right border-r">{fmt(grp.subtotal.opening_credit)}</td>
                                        <td className="px-3 py-2 text-right">{fmt(grp.subtotal.turnover_debit)}</td>
                                        <td className="px-3 py-2 text-right border-r">{fmt(grp.subtotal.turnover_credit)}</td>
                                        <td className="px-3 py-2 text-right">{fmt(grp.subtotal.closing_debit)}</td>
                                        <td className="px-3 py-2 text-right">{fmt(grp.subtotal.closing_credit)}</td>
                                    </tr>
                                    {grp.rows.map((row, i) => (
                                        <tr key={i} className="border-b hover:bg-gray-50">
                                            <td className="px-3 py-2 border-r pl-8 text-gray-700">{row.rent_object}</td>
                                            <td className="px-3 py-2 text-right">{fmt(row.opening_debit)}</td>
                                            <td className="px-3 py-2 text-right border-r">{fmt(row.opening_credit)}</td>
                                            <td className="px-3 py-2 text-right">{fmt(row.turnover_debit)}</td>
                                            <td className="px-3 py-2 text-right border-r">{fmt(row.turnover_credit)}</td>
                                            <td className="px-3 py-2 text-right">{fmt(row.closing_debit)}</td>
                                            <td className="px-3 py-2 text-right">{fmt(row.closing_credit)}</td>
                                        </tr>
                                    ))}
                                </Fragment>
                            ))}
                        </tbody>
                        <tfoot className="bg-gray-100 border-t-2 font-semibold">
                            <tr>
                                <td className="px-3 py-2 border-r">Итого</td>
                                <td className="px-3 py-2 text-right">{fmt(grandTotal.opening_debit)}</td>
                                <td className="px-3 py-2 text-right border-r">{fmt(grandTotal.opening_credit)}</td>
                                <td className="px-3 py-2 text-right">{fmt(grandTotal.turnover_debit)}</td>
                                <td className="px-3 py-2 text-right border-r">{fmt(grandTotal.turnover_credit)}</td>
                                <td className="px-3 py-2 text-right">{fmt(grandTotal.closing_debit)}</td>
                                <td className="px-3 py-2 text-right">{fmt(grandTotal.closing_credit)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            )}
        </div>
    );
}

function groupByAccount(rows: OsvAccountRow[]): AccountGroup[] {
    const order: string[] = [];
    const map = new Map<string, OsvAccountRow[]>();
    const names = new Map<string, string>();

    for (const row of rows) {
        const code = row.account_code ?? '';
        if (!map.has(code)) {
            map.set(code, []);
            names.set(code, row.account_name ?? '');
            order.push(code);
        }
        map.get(code)!.push(row);
    }

    return order.map(code => {
        const groupRows = map.get(code)!;
        return {
            account_code: code,
            account_name: names.get(code) ?? '',
            rows: groupRows,
            subtotal: sumRows(groupRows),
        };
    });
}

function sumRows(rows: OsvAccountRow[]): Totals {
    const acc = emptyTotals();
    for (const row of rows) {
        for (const f of NUMERIC_FIELDS) {
            acc[f] += (row[f] as number | null) ?? 0;
        }
    }
    return acc;
}

function sumTotals(list: Totals[]): Totals {
    const acc = emptyTotals();
    for (const t of list) {
        for (const f of NUMERIC_FIELDS) acc[f] += t[f];
    }
    return acc;
}

function emptyTotals(): Totals {
    return {
        opening_debit: 0,
        opening_credit: 0,
        turnover_debit: 0,
        turnover_credit: 0,
        closing_debit: 0,
        closing_credit: 0,
    };
}

function fmt(value: number | null) {
    if (value === null || value === 0) return '—';
    return new Intl.NumberFormat('ru-RU', { minimumFractionDigits: 2 }).format(value);
}