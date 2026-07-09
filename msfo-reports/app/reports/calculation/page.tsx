'use client';

import { useState, useEffect, Fragment } from 'react';
import dayjs from 'dayjs';
import ObjectSelect from '@/components/ObjectSelect';

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

interface DocGroup {
    document: string;
    rows: CalculationRow[];
}
interface ObjectGroup {
    rent_object: string;
    docs: DocGroup[];
}

const COL_COUNT = 7;

export default function CalculationPage() {
    const [objects, setObjects] = useState<string[]>([]);
    const [objectsLoading, setObjectsLoading] = useState(true);
    const [selectedObject, setSelectedObject] = useState<string>('');
    const [rows, setRows] = useState<CalculationRow[]>([]);
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
            const res = await fetch('/api/reports/calculation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
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

    function formatPeriod(value: string): string {
        const d = dayjs(value);
        return d.isValid() ? d.format('DD.MM.YYYY') : value;
    }

    const groups = groupRows(rows);

    return (
        <div>
            <h1 className="text-xl font-bold text-gray-800 mb-4">Расчёт активов и обязательств</h1>

            <div className="bg-white rounded-lg border p-4 mb-4 flex gap-4 flex-wrap items-end">
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
                                <th colSpan={7} className="px-3 py-2 text-center border-b">Объект аренды</th>
                            </tr>
                            <tr>
                                <th colSpan={7} className="px-3 py-2 text-center border-b">Документ</th>
                            </tr>
                            <tr>
                                <th rowSpan={2} className="px-3 py-2 text-left border-r align-bottom">Период</th>
                                <th colSpan={3} className="px-3 py-2 text-center border-r border-b">Обязательство</th>
                                <th colSpan={3} className="px-3 py-2 text-center border-b">Актив</th>
                            </tr>
                            <tr>
                                <th className="px-3 py-2 text-right">Арендный платёж</th>
                                <th className="px-3 py-2 text-right">Стоимость обязательства</th>
                                <th className="px-3 py-2 text-right border-r">Процентный расход</th>
                                <th className="px-3 py-2 text-right">Стоимость актива</th>
                                <th className="px-3 py-2 text-right">Расход по амортизации</th>
                                <th className="px-3 py-2 text-right">Накопленная амортизация</th>
                            </tr>
                        </thead>
                        <tbody>
                            {groups.map((grp) => (
                                <Fragment key={grp.rent_object}>
                                    <tr className="bg-blue-50 border-b font-semibold">
                                        <td colSpan={COL_COUNT} className="px-3 py-2 text-blue-900">
                                            {grp.rent_object}
                                        </td>
                                    </tr>
                                    {grp.docs.map((doc) => (
                                        <Fragment key={doc.document}>
                                            <tr className="bg-gray-50 border-b">
                                                <td colSpan={COL_COUNT} className="px-6 py-1.5 text-gray-600 italic">
                                                    {doc.document}
                                                </td>
                                            </tr>
                                            {doc.rows.map((row, i) => (
                                                <tr key={i} className="border-b hover:bg-gray-50">
                                                    <td className="px-3 py-2 border-r pl-9">{formatPeriod(row.period)}</td>
                                                    <td className="px-3 py-2 text-right">{fmt(row.payment)}</td>
                                                    <td className="px-3 py-2 text-right">{fmt(row.liability)}</td>
                                                    <td className="px-3 py-2 text-right border-r">{fmt(row.interest_expense)}</td>
                                                    <td className="px-3 py-2 text-right">{fmt(row.asset)}</td>
                                                    <td className="px-3 py-2 text-right">{fmt(row.depreciation_expense)}</td>
                                                    <td className="px-3 py-2 text-right">{fmt(row.accumulated_depreciation)}</td>
                                                </tr>
                                            ))}
                                        </Fragment>
                                    ))}
                                </Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

function groupRows(rows: CalculationRow[]): ObjectGroup[] {
    const objOrder: string[] = [];
    const objMap = new Map<string, Map<string, CalculationRow[]>>();

    for (const row of rows) {
        const obj = row.rent_object ?? '';
        const doc = row.document ?? '';
        if (!objMap.has(obj)) {
            objMap.set(obj, new Map());
            objOrder.push(obj);
        }
        const docMap = objMap.get(obj)!;
        if (!docMap.has(doc)) docMap.set(doc, []);
        docMap.get(doc)!.push(row);
    }

    return objOrder.map(obj => {
        const docMap = objMap.get(obj)!;
        const docs: DocGroup[] = Array.from(docMap.entries()).map(([document, rows]) => ({
            document,
            rows,
        }));
        return { rent_object: obj, docs };
    });
}

function fmt(value: number | null) {
    if (value === null || value === 0) return '—';
    return new Intl.NumberFormat('ru-RU', { minimumFractionDigits: 2 }).format(value);
}