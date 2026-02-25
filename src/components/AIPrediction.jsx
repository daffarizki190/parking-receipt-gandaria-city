import { useEffect, useState } from 'react';
import { BrainCircuit, TrendingUp, Clock, X } from 'lucide-react';

export default function AIPrediction() {
    const [status, setStatus] = useState(null); // 'normal' | 'ramai' | 'padat'
    const [closed, setClosed] = useState(false);

    useEffect(() => {
        // Mock AI prediction based on time
        const hour = new Date().getHours();
        if (hour >= 17 && hour <= 20) setStatus('padat');
        else if ((hour >= 11 && hour <= 14) || (hour >= 15 && hour <= 16)) setStatus('ramai');
        else setStatus('normal');
    }, []);

    if (closed || !status) return null;

    const styles = {
        normal: { bg: 'bg-emerald-50', border: 'border-emerald-100', icon: 'text-emerald-500', text: 'text-emerald-800' },
        ramai: { bg: 'bg-amber-50', border: 'border-amber-100', icon: 'text-amber-500', text: 'text-amber-800' },
        padat: { bg: 'bg-rose-50', border: 'border-rose-100', icon: 'text-rose-500', text: 'text-rose-800' },
    }[status];

    const messages = {
        normal: "Kondisi parkir saat ini terpantau normal.",
        ramai: "Mulai ramai! Estimasi cari parkir 5-10 menit.",
        padat: "Sangat padat! Area lobi penuh, arahkan ke basement bawah.",
    };

    return (
        <div className={`flex items-start gap-4 p-4 rounded-2xl border anim-fade-in shadow-sm ${styles.bg} ${styles.border}`}>
            <div className={`flex-shrink-0 p-2 rounded-xl bg-white/60 shadow-inner-soft ${styles.icon}`}>
                {status === 'normal' ? <Clock size={16} /> : <TrendingUp size={16} />}
            </div>
            <div className="flex-1 mt-0.5">
                <div className="flex items-center gap-1.5 mb-1 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                    <BrainCircuit size={12} className={styles.icon} /> AI Insights
                </div>
                <p className={`text-xs font-semibold leading-relaxed ${styles.text}`}>
                    {messages[status]}
                </p>
            </div>
            <button onClick={() => setClosed(true)} className={`p-1.5 opacity-60 hover:opacity-100 transition-opacity rounded-full bg-white/50 ${styles.text}`}>
                <X size={14} />
            </button>
        </div>
    );
}
