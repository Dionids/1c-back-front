export default function Home() {
    return (
        <div className="max-w-2xl mx-auto mt-10">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">МСФО Отчёты</h1>
            <div className="grid gap-4">
                <a href="/reports/osv-objects"
                   className="block p-6 bg-white rounded-lg border hover:border-blue-500 transition-colors">
                    <h2 className="font-semibold text-gray-800">ОСВ объектов аренды</h2>
                    <p className="text-gray-500 text-sm mt-1">Оборотно-сальдовая ведомость по объектам</p>
                </a>
                <a href="/reports/osv-accounts"
                   className="block p-6 bg-white rounded-lg border hover:border-blue-500 transition-colors">
                    <h2 className="font-semibold text-gray-800">ОСВ по счетам</h2>
                    <p className="text-gray-500 text-sm mt-1">Оборотно-сальдовая ведомость по счетам</p>
                </a>
                <a href="/reports/calculation/page"
                   className="block p-6 bg-white rounded-lg border hover:border-blue-500 transition-colors">
                    <h2 className="font-semibold text-gray-800">Расчёт активов и обязательств</h2>
                    <p className="text-gray-500 text-sm mt-1">Детальный расчёт по договорам аренды</p>
                </a>
            </div>
        </div>
    );
}