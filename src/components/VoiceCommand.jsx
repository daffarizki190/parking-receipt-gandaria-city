import { useState, useEffect } from 'react';
import { Mic, MicOff } from 'lucide-react';

const VehicleKeywords = {
    "mobil": "mobil", "motor": "motor", "sepeda motor": "motor",
    "box": "box", "truk": "box", "valet": "valet_weekday",
    "valet weekday": "valet_weekday", "valet weekend": "valet_weekend",
};

export default function VoiceCommand({ onCommand }) {
    const [isListening, setIsListening] = useState(false);
    const [recognition, setRecognition] = useState(null);
    const [status, setStatus] = useState('');

    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            const rec = new SpeechRecognition();
            rec.lang = 'id-ID';
            rec.interimResults = false;
            rec.maxAlternatives = 1;

            rec.onstart = () => {
                setIsListening(true);
                setStatus('Mendengarkan... (Coba: "Mobil masuk jam 10 pagi")');
            };
            rec.onerror = (e) => {
                setStatus(`Error: ${e.error}`);
                setIsListening(false);
            };
            rec.onend = () => {
                setIsListening(false);
                setTimeout(() => setStatus(''), 3000);
            };
            rec.onresult = (e) => {
                const transcript = e.results[0][0].transcript.toLowerCase();
                processTranscript(transcript);
            };
            setRecognition(rec);
        }
    }, []);

    const processTranscript = (text) => {
        let vehicle = null;
        let time = null;
        let isExit = text.includes('keluar');

        for (const [kw, val] of Object.entries(VehicleKeywords)) {
            if (text.includes(kw)) { vehicle = val; break; }
        }

        const match = text.match(/(?:jam|pukul)\s+(\d{1,2})(?::(\d{2}))?\s*(pagi|siang|sore|malam)?/i);
        if (match) {
            let hours = parseInt(match[1], 10);
            const mins = match[2] ? parseInt(match[2], 10) : 0;
            const period = (match[3] || '').toLowerCase();

            if (period === 'sore' || period === 'malam') hours = hours < 12 ? hours + 12 : hours;
            if (period === 'pagi' && hours === 12) hours = 0;
            if (period === 'siang' && hours < 12) hours += 12;

            const dt = new Date();
            dt.setHours(hours, mins, 0, 0);
            time = dt;
        }

        onCommand({ vehicle, time, isExit, raw: text });
        setStatus(`✓ Terdeteksi: "${text}"`);
    };

    const toggleListen = () => {
        if (!recognition) return alert('Browser tidak mendukung Web Speech API (Gunakan Chrome).');
        if (isListening) recognition.stop();
        else recognition.start();
    };

    return (
        <div className="flex flex-col items-end">
            <button
                type="button"
                onClick={toggleListen}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all border ${isListening
                        ? 'bg-red-500/20 text-red-500 border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.4)] animate-pulse'
                        : 'bg-white/5 text-accent border-white/10 hover:bg-accent/10 hover:border-accent/40'
                    }`}
                title="Perintah Suara (AI)"
            >
                {isListening ? <MicOff size={18} /> : <Mic size={18} />}
            </button>

            {status && (
                <div className="absolute top-16 right-0 bg-black/80 backdrop-blur-sm border border-white/10 text-white text-xs px-3 py-2 rounded-lg z-10 whitespace-nowrap shadow-xl">
                    {status}
                </div>
            )}
        </div>
    );
}
