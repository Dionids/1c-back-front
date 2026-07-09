'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

interface BaseProps {
    objects: string[];
    loading?: boolean;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
}

interface SingleProps extends BaseProps {
    multiple?: false;
    value: string;                      // '' = все объекты
    onChange: (value: string) => void;
}

interface MultiProps extends BaseProps {
    multiple: true;
    value: string[];                    // [] = все объекты
    onChange: (value: string[]) => void;
}

type Props = SingleProps | MultiProps;

// Единый выпадающий список объектов аренды с поиском.
// В одиночном режиме — выбор одного объекта или «Все».
// В мультирежиме — отметка нескольких объектов (пусто = все).
export default function ObjectSelect(props: Props) {
    const { objects, loading = false, disabled = false, className = '' } = props;
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const rootRef = useRef<HTMLDivElement>(null);

    // Закрытие по клику вне компонента
    useEffect(() => {
        function onDocClick(e: MouseEvent) {
            if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener('mousedown', onDocClick);
        return () => document.removeEventListener('mousedown', onDocClick);
    }, []);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return objects;
        return objects.filter(o => o.toLowerCase().includes(q));
    }, [objects, query]);

    const isDisabled = disabled || loading;

    // ---- Текст на кнопке ----
    let buttonLabel: string;
    if (loading) {
        buttonLabel = 'Загрузка объектов…';
    } else if (props.multiple) {
        const n = props.value.length;
        buttonLabel =
            n === 0 ? 'Все объекты' : n === 1 ? props.value[0] : `Выбрано: ${n}`;
    } else {
        buttonLabel = props.value === '' ? 'Все объекты' : props.value;
    }

    function toggleMulti(obj: string) {
        if (!props.multiple) return;
        const set = new Set(props.value);
        if (set.has(obj)) set.delete(obj);
        else set.add(obj);
        props.onChange(Array.from(set));
    }

    function chooseSingle(obj: string) {
        if (props.multiple) return;
        props.onChange(obj);
        setOpen(false);
        setQuery('');
    }

    return (
        <div ref={rootRef} className={`relative ${className}`}>
            <button
                type="button"
                disabled={isDisabled}
                onClick={() => setOpen(o => !o)}
                className="w-full border rounded px-3 py-2 text-sm text-left bg-white flex items-center justify-between gap-2 disabled:opacity-60 hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
            >
                <span className="truncate">{buttonLabel}</span>
                <span className="text-gray-400 shrink-0">▾</span>
            </button>

            {open && !isDisabled && (
                <div className="absolute z-20 mt-1 w-full min-w-56 bg-white border rounded shadow-lg">
                    <div className="p-2 border-b">
                        <input
                            autoFocus
                            type="text"
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            placeholder="Поиск объекта…"
                            className="w-full border rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                        />
                    </div>

                    <ul className="max-h-64 overflow-y-auto py-1 text-sm">
                        {/* Пункт «Все объекты» */}
                        {props.multiple ? (
                            <li>
                                <button
                                    type="button"
                                    onClick={() => props.onChange([])}
                                    className={`w-full text-left px-3 py-1.5 hover:bg-gray-100 flex items-center gap-2 ${
                                        props.value.length === 0 ? 'font-medium text-blue-700' : ''
                                    }`}
                                >
                                    <span className="w-4 shrink-0">
                                        {props.value.length === 0 ? '✓' : ''}
                                    </span>
                                    Все объекты
                                </button>
                            </li>
                        ) : (
                            <li>
                                <button
                                    type="button"
                                    onClick={() => chooseSingle('')}
                                    className={`w-full text-left px-3 py-1.5 hover:bg-gray-100 ${
                                        props.value === '' ? 'font-medium text-blue-700' : ''
                                    }`}
                                >
                                    Все объекты
                                </button>
                            </li>
                        )}

                        {filtered.length === 0 && (
                            <li className="px-3 py-2 text-gray-400">Ничего не найдено</li>
                        )}

                        {filtered.map(obj => {
                            const selected = props.multiple
                                ? props.value.includes(obj)
                                : props.value === obj;
                            return (
                                <li key={obj}>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            props.multiple ? toggleMulti(obj) : chooseSingle(obj)
                                        }
                                        className={`w-full text-left px-3 py-1.5 hover:bg-gray-100 flex items-center gap-2 ${
                                            selected ? 'text-blue-700 font-medium' : ''
                                        }`}
                                    >
                                        {props.multiple && (
                                            <span className="w-4 shrink-0">{selected ? '✓' : ''}</span>
                                        )}
                                        <span className="truncate">{obj}</span>
                                    </button>
                                </li>
                            );
                        })}
                    </ul>

                    {props.multiple && props.value.length > 0 && (
                        <div className="p-2 border-t flex justify-between items-center text-xs text-gray-500">
                            <span>Выбрано: {props.value.length}</span>
                            <button
                                type="button"
                                onClick={() => props.onChange([])}
                                className="text-blue-600 hover:underline"
                            >
                                Сбросить
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}