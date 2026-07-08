import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
    title: 'МСФО Отчёты',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="ru">
            <body className="bg-gray-50 min-h-screen">
                <header className="bg-white border-b px-6 py-4">
                    <nav className="flex gap-6">
                        <a href="/" className="font-semibold text-gray-800">МСФО</a>
                        <a href="/reports/osv-objects" className="text-gray-600 hover:text-gray-900">ОСВ объектов</a>
                        <a href="/reports/osv-accounts" className="text-gray-600 hover:text-gray-900">ОСВ по счетам</a>
                        <a href="/reports/calculation" className="text-gray-600 hover:text-gray-900">Расчёт активов</a>
                    </nav>
                </header>
                <main className="p-6">{children}</main>
            </body>
        </html>
    );
}