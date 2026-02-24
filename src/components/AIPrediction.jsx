import { useState, useEffect } from 'react';

export default function AIPrediction() {
    const [msg, setMsg] = useState('Memuat data...');
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const history = JSON.parse(localStorage.getItem('parkingHistory') || '[]');
        if (history.length < 3) {
            setVisible(false);
            return;
        }

        const hourCounts = new Array(24).fill(0);
        history.forEach(tx => {
            const h = new Date(tx.timestamp).getHours();
            hourCounts[h]++;
        });

        const currentHour = new Date().getHours();
        const avgCount = hourCounts.reduce((a, b) => a + b, 0) / 24;
        const peakHour = hourCounts.indexOf(Math.max(...hourCounts));

        let prediction = "";
        const load = hourCounts[currentHour];
        if (load > avgCount * 1.5) {
            prediction = `Jam sekarang (${currentHour}:00) diprediksi padat. Jam paling ramai biasanya pukul ${peakHour}:00.`;
        } else if (load < avgCount * 0.5) {
            prediction = `Saat ini relatif sepi. Jam tersibuk biasanya pukul ${peakHour}:00.`;
        } else {
            prediction = `Volume normal sekarang.`;
        }

        setMsg(prediction);
        setVisible(true);
    }, []);

    if (!visible) return null;

    return (
        <div className="flex items-center gap-3 bg-indigo-500/10 border border-indigo-500/30 rounded-xl p-3 mb-5">
            <div className="text-2xl">🤖</div>
            <div className="flex flex-col">
                <strong className="text-xs uppercase tracking-wider text-accent">Prediksi AI</strong>
                <span className="text-sm text-white/90">{msg}</span>
            </div>
        </div>
    );
}
