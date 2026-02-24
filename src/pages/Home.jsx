import { useState } from 'react';
import { Camera, Calculator, FileText } from 'lucide-react';
import FormSection from '../components/FormSection';
import QRScanner from '../components/QRScanner';
import ReceiptSection from '../components/ReceiptSection';
import { buildBreakdown, saveTransaction, formatDateTime, formatIDR } from '../lib/parkingLogic';

export default function Home() {
    const [activeTab, setActiveTab] = useState('kalkulator');
    const [scannedData, setScannedData] = useState(null);
    const [result, setResult] = useState(null);
    const [showReceipt, setShowReceipt] = useState(false);

    const handleFormSubmit = ({ vehicle, entry, exit }) => {
        const breakdown = buildBreakdown({ vehicle, entry, exit });
        if (breakdown.error) {
            alert(breakdown.error);
            return;
        }

        saveTransaction(breakdown, entry, exit, vehicle);
        setResult({ breakdown, entry, exit, vehicle });
        setShowReceipt(false);
    };

    const handleScanSuccess = (data) => {
        setScannedData(data);
        setTimeout(() => setActiveTab('kalkulator'), 1000); // switch to form after scan
    };

    if (showReceipt && result) {
        return <ReceiptSection data={result} onClose={() => setShowReceipt(false)} />;
    }

    return (
        <div className="flex flex-col gap-6">
            {/* Tab Navigation */}
            <nav className="flex gap-2 p-1.5 bg-white/5 border border-white/10 rounded-2xl mb-2 backdrop-blur-md">
                <button
                    onClick={() => setActiveTab('kalkulator')}
                    className={`flex-1 flex justify-center items-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold transition-all ${activeTab === 'kalkulator' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/40' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                >
                    <Calculator size={16} /> Kalkulator
                </button>
                <button
                    onClick={() => setActiveTab('scanner')}
                    className={`flex-1 flex justify-center items-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold transition-all ${activeTab === 'scanner' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/40' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                >
                    <Camera size={16} /> Kamera Cerdas
                </button>
            </nav>

            {/* Main Views */}
            {activeTab === 'kalkulator' ? (
                <FormSection initialData={scannedData} onSubmit={handleFormSubmit} />
            ) : (
                <QRScanner onScanSuccess={handleScanSuccess} />
            )}

            {/* Results View */}
            {result && activeTab === 'kalkulator' && (
                <div className="glass-card flex flex-col rounded-3xl animate-in slide-in-from-bottom-4 duration-300 mt-2 overflow-hidden">
                    <div className="p-4 sm:p-6 bg-white/5 border-b border-white/5">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <FileText size={20} className="text-accent" /> Detail Biaya
                        </h2>
                    </div>

                    <div className="p-4 sm:p-6 pb-2">
                        <div className="grid grid-cols-[100px_1fr] gap-y-3 mb-6 relative">
                            <div className="text-xs text-slate-400 font-medium">Jam Masuk</div>
                            <div className="text-sm font-mono text-white">{formatDateTime(result.entry)}</div>
                            <div className="text-xs text-slate-400 font-medium">Jam Keluar</div>
                            <div className="text-sm font-mono text-white">{formatDateTime(result.exit)}</div>
                            <div className="text-xs text-slate-400 font-medium">Durasi</div>
                            <div className="text-sm font-semibold bg-indigo-500/20 text-indigo-300 px-2 py-1 rounded w-fit">{result.breakdown.durDays}h {result.breakdown.durHoursRem}j {result.breakdown.durMins}m</div>
                        </div>

                        <div className="bg-black/20 rounded-xl overflow-hidden border border-white/5">
                            <div className="grid grid-cols-2 gap-4 p-3 bg-white/5 border-b border-white/10 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                <div>Komponen</div>
                                <div className="text-right">Subtotal</div>
                            </div>
                            <div className="p-3">
                                {result.breakdown.hourlyRows.map((r, i) => (
                                    <div key={i} className="flex justify-between items-center mb-2 last:mb-0">
                                        <div className="flex flex-col">
                                            <span className="text-sm text-slate-200">{r.label}</span>
                                            <span className="text-[10px] text-slate-400">{r.unit}</span>
                                        </div>
                                        <div className="font-mono text-sm text-slate-300">{formatIDR(r.subtotal)}</div>
                                    </div>
                                ))}
                            </div>
                            <div className="p-4 bg-indigo-500/10 flex justify-between items-center border-t border-indigo-500/30">
                                <span className="text-sm font-bold text-white uppercase tracking-wider">Total</span>
                                <span className="font-mono text-xl font-bold text-accent">{formatIDR(result.breakdown.totalCharge)}</span>
                            </div>
                        </div>
                    </div>

                    <div className="p-4 sm:p-6 flex gap-3">
                        <button
                            onClick={() => setResult(null)}
                            className="flex-1 py-3.5 rounded-xl font-semibold bg-white/5 hover:bg-white/10 text-slate-300 transition-colors"
                        >
                            Tutup
                        </button>
                        <button
                            onClick={() => setShowReceipt(true)}
                            className="flex-[2] flex justify-center items-center gap-2 py-3.5 rounded-xl font-semibold bg-accent/20 border border-accent/40 text-accent hover:bg-accent/30 transition-colors"
                        >
                            Tampilkan Resi Lengkap
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
