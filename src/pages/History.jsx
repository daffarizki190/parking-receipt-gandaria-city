import { useState, useEffect, useMemo } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import { Trash2, Download, BarChart2, TrendingUp, Clock, Car, Banknote, X } from 'lucide-react';
import { formatIDR, getVehicleLabel, formatDateTime } from '../lib/parkingLogic';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

const chartDefaults = {
    plugins: {
        legend: { labels: { color: '#64748b', font: { family: 'Inter', size: 11, weight: '500' }, boxWidth: 12 } },
        tooltip: {
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            titleColor: '#0f172a',
            bodyColor: '#475569',
            borderColor: '#e2e8f0',
            borderWidth: 1,
            bodyFont: { family: 'JetBrains Mono' },
            titleFont: { family: 'Space Grotesk', weight: 'bold' }
        },
    },
    maintainAspectRatio: false,
    responsive: true,
};

function StatCard({ icon: Icon, label, value, sub, color = 'indigo' }) {
    const colors = {
        indigo: { icon: 'text-indigo-600', bg: 'bg-indigo-50 border-indigo-100' },
        sky: { icon: 'text-sky-500', bg: 'bg-sky-50 border-sky-100' },
        emerald: { icon: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100' },
        amber: { icon: 'text-amber-600', bg: 'bg-amber-50 border-amber-100' },
    }[color];

    return (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
            <div className={`absolute -right-6 -top-6 w-20 h-20 rounded-full opacity-20 filter blur-xl ${colors.bg.split(' ')[0]}`} />

            <div className={`inline-flex p-2.5 rounded-xl border mb-3 ${colors.bg} relative z-10`}>
                <Icon size={18} className={colors.icon} />
            </div>

            <div className="relative z-10">
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">{label}</p>
                <p className="text-xl font-black text-slate-800 mb-0.5" style={{ fontFamily: 'Space Grotesk, sans-serif', letterSpacing: '-0.5px' }}>{value}</p>
                {sub && <p className="text-[10px] text-slate-400 font-medium">{sub}</p>}
            </div>
        </div>
    );
}

export default function History() {
    const [history, setHistory] = useState([]);
    const [filter, setFilter] = useState('all');
    const [showClearConfirm, setShowClearConfirm] = useState(false);

    useEffect(() => {
        setHistory(JSON.parse(localStorage.getItem('parkingHistory') || '[]'));
    }, []);

    const stats = useMemo(() => {
        if (!history.length) return null;
        const total = history.reduce((s, tx) => s + tx.total, 0);
        const avg = Math.round(total / history.length);
        const vehicleCounts = {};
        const hourCounts = new Array(24).fill(0);
        history.forEach(tx => {
            vehicleCounts[tx.vehicle] = (vehicleCounts[tx.vehicle] || 0) + 1;
            hourCounts[new Date(tx.timestamp).getHours()]++;
        });
        const topVehicle = Object.entries(vehicleCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
        const peakHour = hourCounts.indexOf(Math.max(...hourCounts));
        return { total, avg, vehicleCounts, hourCounts, topVehicle, peakHour };
    }, [history]);

    const vehicleChartData = useMemo(() => !stats ? null : ({
        labels: Object.keys(stats.vehicleCounts).map(k => getVehicleLabel(k).replace(/^[^\s]+\s/, '')),
        datasets: [{
            data: Object.values(stats.vehicleCounts),
            backgroundColor: ['#4f46e5', '#0ea5e9', '#8b5cf6', '#f43f5e', '#f59e0b'],
            borderWidth: 2,
            borderColor: '#ffffff',
            hoverOffset: 6
        }],
    }), [stats]);

    const hourChartData = useMemo(() => !stats ? null : ({
        labels: Array.from({ length: 24 }, (_, i) => i % 4 === 0 ? `${String(i).padStart(2, '0')}:00` : ''),
        datasets: [{
            label: 'Tx',
            data: stats.hourCounts,
            backgroundColor: stats.hourCounts.map((v, i) => i === stats.peakHour ? '#4f46e5' : 'rgba(79, 70, 229, 0.15)'),
            borderRadius: 6,
            borderSkipped: false
        }],
    }), [stats]);

    const exportCSV = () => {
        const rows = [['ID', 'Timestamp', 'Kendaraan', 'Plat Nomor', 'Tipe Tiket', 'Masuk', 'Keluar', 'Durasi(min)', 'Total']];
        history.forEach(tx => rows.push([tx.id, tx.timestamp, tx.vehicle, tx.plate || '-', tx.isLostTicket ? 'Lost Tiket' : 'Casual', tx.entry, tx.exit, tx.duration, tx.total]));
        const csv = rows.map(r => r.join(',')).join('\n');
        const a = document.createElement('a');
        a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
        a.download = `parkmate-history-${Date.now()}.csv`;
        a.click();
    };

    const handleClear = () => {
        localStorage.setItem('parkingHistory', '[]');
        setHistory([]);
        setShowClearConfirm(false);
    };

    const handleDeleteTx = (id) => {
        const newHistory = history.filter(tx => tx.id !== id);
        localStorage.setItem('parkingHistory', JSON.stringify(newHistory));
        setHistory(newHistory);
    };

    const filteredHistory = useMemo(() => {
        if (filter === 'all') return history;
        return history.filter(tx => tx.vehicle === filter);
    }, [history, filter]);

    if (!history.length) {
        return (
            <div className="glass flex flex-col items-center justify-center p-12 text-center my-6 min-h-[360px] anim-fade-in shadow-sm">
                <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mb-5 shadow-inner-soft">
                    <BarChart2 size={28} className="text-slate-300" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Belum ada data</h3>
                <p className="text-sm text-slate-500 leading-relaxed max-w-[200px]">Data transaksi akan muncul di sini setelah kalkulasi.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 anim-slide-up">

            {/* ─── Stat Cards ─── */}
            <div className="grid grid-cols-2 gap-3">
                <StatCard icon={Banknote} label="Total Omzet" value={formatIDR(stats.total)} sub={`${history.length} transaksi`} color="indigo" />
                <StatCard icon={Clock} label="Peak Hour" value={`${String(stats.peakHour).padStart(2, '0')}:00`} sub="Volume tertinggi" color="sky" />
                <StatCard icon={TrendingUp} label="Rata-rata" value={formatIDR(stats.avg)} sub="Per kendaraan" color="emerald" />
                <StatCard icon={Car} label="Terbanyak" value={stats.topVehicle ? getVehicleLabel(stats.topVehicle).replace(/^[^\s]+\s/, '') : '-'} sub="Jenis kendaraan" color="amber" />
            </div>

            {/* ─── Charts ─── */}
            <div className="glass p-5 shadow-sm">
                <h2 className="font-bold text-base text-slate-800 mb-5 flex items-center gap-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                    <BarChart2 size={18} className="text-indigo-500" /> Analitik AI
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 shadow-inner-soft">
                        <p className="text-[10px] text-slate-500 font-bold text-center mb-4 uppercase tracking-widest">Penanganan Unit</p>
                        <div className="h-44">
                            <Doughnut data={vehicleChartData} options={{ ...chartDefaults, cutout: '70%', plugins: { ...chartDefaults.plugins, legend: { position: 'bottom', labels: { ...chartDefaults.plugins.legend.labels, padding: 16 } } } }} />
                        </div>
                    </div>
                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 shadow-inner-soft">
                        <p className="text-[10px] text-slate-500 font-bold text-center mb-4 uppercase tracking-widest">Trafik Waktu</p>
                        <div className="h-44">
                            <Bar data={hourChartData} options={{ ...chartDefaults, scales: { x: { grid: { display: false }, ticks: { color: '#94a3b8', font: { size: 10 } } }, y: { grid: { color: 'rgba(0,0,0,0.04)', drawBorder: false }, ticks: { color: '#94a3b8', stepSize: 1, font: { size: 10 } }, border: { display: false } } }, plugins: { ...chartDefaults.plugins, legend: { display: false } } }} />
                        </div>
                    </div>
                </div>
            </div>

            {/* ─── History List ─── */}
            <div className="glass p-5 shadow-sm mb-6">
                <div className="flex justify-between items-center mb-5">
                    <h2 className="font-bold text-base text-slate-800 dark:text-slate-100 flex items-center gap-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                        Riwayat Transaksi
                        <span className="chip chip-indigo ml-1 text-[10px] bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-500/30">{history.length}</span>
                    </h2>
                    <div className="flex gap-2">
                        <button onClick={exportCSV} className="btn-icon bg-sky-50 text-sky-600 border-sky-100 hover:bg-sky-100 dark:bg-sky-500/10 dark:text-sky-400 dark:border-sky-500/20 dark:hover:bg-sky-500/20 text-[10px] font-bold tracking-wider" style={{ width: 'auto', padding: '0 12px' }}>
                            <Download size={14} className="mr-1.5" /> CSV
                        </button>
                        {showClearConfirm ? (
                            <div className="flex bg-rose-50 border border-rose-100 dark:bg-rose-500/10 dark:border-rose-500/20 rounded-xl overflow-hidden">
                                <button onClick={handleClear} className="px-3 text-[10px] font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-500/20 uppercase tracking-wider transition-colors border-r border-rose-100 dark:border-rose-500/20">
                                    Ya, Hapus
                                </button>
                                <button onClick={() => setShowClearConfirm(false)} className="px-2 text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-colors">
                                    <X size={14} />
                                </button>
                            </div>
                        ) : (
                            <button onClick={() => setShowClearConfirm(true)} className="btn-icon bg-rose-50 text-rose-500 border-rose-100 hover:bg-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20 dark:hover:bg-rose-500/20 text-xs">
                                <Trash2 size={16} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Filter chips */}
                <div className="flex gap-2 overflow-x-auto pb-3 mb-2 scrollbar-none snap-x">
                    {['all', 'motor', 'mobil', 'box', 'valet_weekday', 'valet_weekend'].map(k => (
                        <button
                            key={k}
                            onClick={() => setFilter(k)}
                            className={`chip flex-shrink-0 cursor-pointer snap-start ${filter === k ? 'chip-indigo shadow-sm' : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100 shadow-none'}`}
                        >
                            {k === 'all' ? 'Semua' : getVehicleLabel(k).replace(/^[^\s]+\s/, '')}
                        </button>
                    ))}
                </div>

                <div className="flex flex-col gap-3">
                    {filteredHistory.map((tx, idx) => (
                        <div
                            key={tx.id}
                            className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:border-indigo-200 hover:shadow-md transition-all duration-300 relative overflow-hidden group"
                            style={{ animationDelay: `${idx * 0.05}s` }}
                        >
                            {/* Left accent line */}
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-indigo-400 to-sky-400 opacity-0 group-hover:opacity-100 transition-opacity" />

                            <div className="pl-1">
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <p className="font-mono text-[9px] text-slate-400 tracking-widest">{tx.id}</p>
                                            {tx.plate && <span className="text-[9px] font-mono font-black text-indigo-500 bg-indigo-50 px-1 rounded border border-indigo-100 dark:bg-indigo-500/20 dark:border-indigo-500/30 dark:text-indigo-400">{tx.plate}</span>}
                                            {tx.isLostTicket && <span className="text-[9px] font-bold text-rose-500 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-100 dark:bg-rose-500/20 dark:border-rose-500/30 dark:text-rose-400 uppercase tracking-wider">Lost Tiket</span>}
                                        </div>
                                        <p className="text-[11px] font-bold text-slate-800 mt-1">{new Date(tx.timestamp).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}</p>
                                    </div>
                                    <div className="text-right flex flex-col justify-between items-end">
                                        <button onClick={() => handleDeleteTx(tx.id)} title="Hapus transaksi ini" className="text-slate-300 hover:text-rose-500 dark:text-slate-600 dark:hover:text-rose-400 transition-colors p-1 mb-1">
                                            <Trash2 size={14} />
                                        </button>
                                        <div>
                                            <p className="font-mono font-black text-lg text-indigo-600 dark:text-indigo-400 tracking-tight">{formatIDR(tx.total)}</p>
                                            <span className="chip bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800/50 dark:text-slate-300 dark:border-slate-700/50 text-[9px] mt-1 shadow-none inline-flex">{getVehicleLabel(tx.vehicle)}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="bg-slate-50 border border-slate-100 rounded-xl px-3 py-2">
                                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mb-0.5">Masuk</p>
                                        <p className="font-mono text-[11px] font-medium text-slate-700">{formatDateTime(tx.entry)}</p>
                                    </div>
                                    <div className="bg-slate-50 border border-slate-100 rounded-xl px-3 py-2">
                                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mb-0.5">Keluar</p>
                                        <p className="font-mono text-[11px] font-medium text-slate-700">{formatDateTime(tx.exit)}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
