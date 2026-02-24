import { useState, useEffect, useMemo } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import { Download, Trash2, PieChart } from 'lucide-react';
import { formatIDR, getVehicleLabel, formatDateTime } from '../lib/parkingLogic';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

export default function History() {
    const [history, setHistory] = useState([]);

    useEffect(() => {
        setHistory(JSON.parse(localStorage.getItem('parkingHistory') || '[]'));
    }, []);

    const handleClear = () => {
        if (window.confirm('Hapus semua riwayat transaksi? Tindakan ini tidak dapat dibatalkan.')) {
            localStorage.setItem('parkingHistory', '[]');
            setHistory([]);
        }
    };

    const stats = useMemo(() => {
        if (!history.length) return null;

        const total = history.reduce((sum, tx) => sum + tx.total, 0);
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

    const vehicleChartData = useMemo(() => {
        if (!stats) return null;
        return {
            labels: Object.keys(stats.vehicleCounts).map(getVehicleLabel),
            datasets: [{
                data: Object.values(stats.vehicleCounts),
                backgroundColor: ['#6366f1', '#ec4899', '#38bdf8', '#a78bfa', '#34d399'],
                borderWidth: 0,
            }]
        };
    }, [stats]);

    const hourChartData = useMemo(() => {
        if (!stats) return null;
        return {
            labels: Array.from({ length: 24 }, (_, i) => `${i < 10 ? '0' : ''}${i}:00`),
            datasets: [{
                label: 'Transaksi',
                data: stats.hourCounts,
                backgroundColor: 'rgba(99,102,241,0.6)',
                borderRadius: 4,
            }]
        };
    }, [stats]);

    const chartOptions = {
        color: '#94a3b8',
        plugins: { legend: { labels: { color: '#94a3b8', font: { family: 'Outfit' } } } },
        maintainAspectRatio: false,
    };

    if (!history.length) {
        return (
            <div className="glass-card flex flex-col items-center justify-center p-12 text-center rounded-3xl min-h-[400px]">
                <PieChart size={64} className="text-slate-600 mb-4 opacity-50" />
                <h3 className="text-xl font-bold text-white mb-2">Belum ada transaksi</h3>
                <p className="text-slate-400">Riwayat dan statistik akan muncul setelah kalkulasi pertama.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-300">

            {/* ─── LIVE DASHBOARD ─── */}
            <section className="glass-card rounded-3xl overflow-hidden p-6">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg font-bold flex items-center gap-2">
                        📊 Statistik Langsung
                    </h2>
                    <span className="bg-indigo-500/10 text-accent text-xs font-bold px-3 py-1.5 rounded-full border border-indigo-500/20">
                        {history.length} Transaksi
                    </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                    <div className="bg-black/20 p-5 rounded-2xl border border-white/5 flex flex-col">
                        <span className="text-xs font-bold tracking-wider text-slate-400 uppercase mb-1">Total Pendapatan</span>
                        <span className="text-2xl font-bold text-white mb-1">{formatIDR(stats.total)}</span>
                        <span className="text-[10px] text-slate-500">Semua transaksi tersimpan</span>
                    </div>
                    <div className="bg-black/20 p-5 rounded-2xl border border-white/5 flex flex-col">
                        <span className="text-xs font-bold tracking-wider text-slate-400 uppercase mb-1">Peak Hour (AI)</span>
                        <span className="text-2xl font-bold text-white mb-1">{stats.peakHour < 10 ? '0' : ''}{stats.peakHour}:00</span>
                        <span className="text-[10px] text-slate-500">Beban volume paling tinggi</span>
                    </div>
                    <div className="bg-black/20 p-5 rounded-2xl border border-white/5 flex flex-col">
                        <span className="text-xs font-bold tracking-wider text-slate-400 uppercase mb-1">Rata-rata/Tx</span>
                        <span className="text-2xl font-bold text-white mb-1">{formatIDR(stats.avg)}</span>
                        <span className="text-[10px] text-slate-500">Rata-rata per kendaraan</span>
                    </div>
                    <div className="bg-black/20 p-5 rounded-2xl border border-white/5 flex flex-col">
                        <span className="text-xs font-bold tracking-wider text-slate-400 uppercase mb-1">Kendaraan Terbanyak</span>
                        <span className="text-2xl font-bold text-white mb-1">{stats.topVehicle ? getVehicleLabel(stats.topVehicle) : '-'}</span>
                        <span className="text-[10px] text-slate-500">Berdasar komposisi</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-black/20 p-5 rounded-2xl border border-white/5">
                        <h3 className="text-sm font-semibold text-slate-400 mb-4 text-center">Komposisi Kendaraan</h3>
                        <div className="h-[200px]">
                            <Doughnut data={vehicleChartData} options={{ ...chartOptions, cutout: '70%', plugins: { ...chartOptions.plugins, legend: { position: 'bottom', labels: { color: '#94a3b8', padding: 15, font: { family: 'Outfit', size: 11 } } } } }} />
                        </div>
                    </div>
                    <div className="bg-black/20 p-5 rounded-2xl border border-white/5">
                        <h3 className="text-sm font-semibold text-slate-400 mb-4 text-center">Aktivitas per Jam</h3>
                        <div className="h-[200px]">
                            <Bar data={hourChartData} options={{ ...chartOptions, scales: { x: { ticks: { maxRotation: 0, maxTicksLimit: 6 } }, y: { ticks: { stepSize: 1 } } }, plugins: { ...chartOptions.plugins, legend: { display: false } } }} />
                        </div>
                    </div>
                </div>
            </section>

            {/* ─── TRANSACTION HISTORY LIST ─── */}
            <section className="glass-card rounded-3xl p-6">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg font-bold flex items-center gap-2">🧾 Riwayat Lengkap</h2>
                    <button onClick={handleClear} className="flex items-center gap-2 text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors">
                        <Trash2 size={14} /> Bersihkan
                    </button>
                </div>

                <div className="flex flex-col gap-3">
                    {history.map(tx => (
                        <div key={tx.id} className="bg-black/20 border border-white/5 rounded-2xl p-4 relative overflow-hidden group hover:bg-white/5 transition-colors">
                            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-primary to-accent" />

                            <div className="flex justify-between items-start mb-3">
                                <div className="flex flex-col">
                                    <span className="font-mono text-[10px] text-slate-500 mb-1">{tx.id}</span>
                                    <span className="text-xs font-medium text-slate-300">{new Date(tx.timestamp).toLocaleString('id-ID')}</span>
                                </div>
                                <div className="text-right flex flex-col items-end">
                                    <span className="font-mono font-bold text-accent text-lg">{formatIDR(tx.total)}</span>
                                    <span className="text-[10px] font-bold bg-white/10 text-white px-2 py-0.5 rounded-full mt-1">{getVehicleLabel(tx.vehicle)}</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-xs">
                                <div className="bg-white/5 p-2 rounded-lg">
                                    <div className="text-slate-500 mb-0.5">Masuk</div>
                                    <div className="font-mono text-slate-300">{formatDateTime(tx.entry)}</div>
                                </div>
                                <div className="bg-white/5 p-2 rounded-lg">
                                    <div className="text-slate-500 mb-0.5">Keluar</div>
                                    <div className="font-mono text-slate-300">{formatDateTime(tx.exit)}</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

        </div>
    );
}
