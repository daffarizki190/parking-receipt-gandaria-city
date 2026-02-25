import { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, X } from 'lucide-react';

export default function VoiceCommand({ onFill, onClose }) {
    const [listening, setListening] = useState(true);
    const [transcript, setTranscript] = useState('');
    const [status, setStatus] = useState('Mendengarkan...');
    const recognitionRef = useRef(null);

    useEffect(() => {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            setStatus('Browser tidak mendukung Voice API.');
            setListening(false);
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.lang = 'id-ID';
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = true;

        recognitionRef.current.onstart = () => {
            setListening(true);
            setStatus('Silakan bicara...');
        };

        recognitionRef.current.onresult = (e) => {
            const current = e.resultIndex;
            const text = e.results[current][0].transcript;
            setTranscript(text);
        };

        recognitionRef.current.onend = () => {
            setListening(false);
            if (transcript) processText(transcript);
        };

        recognitionRef.current.start();

        return () => {
            if (recognitionRef.current) recognitionRef.current.stop();
        };
    }, []);

    const processText = (text) => {
        setStatus('Memproses AI...');
        const t = text.toLowerCase();
        let valV = null, valE = null;

        if (t.includes('motor')) valV = 'motor';
        else if (t.includes('truk') || t.includes('box')) valV = 'box';
        else if (t.includes('mobil')) valV = 'mobil';

        const matchJam = t.match(/jam\s*(\d{1,2})/);
        if (matchJam) {
            const h = parseInt(matchJam[1], 10);
            const isSiangMalam = t.includes('malam') || t.includes('sore');
            let fh = h;
            if (isSiangMalam && h < 12) fh += 12;
            else if (t.includes('pagi') && h === 12) fh = 0;

            const d = new Date();
            d.setHours(fh, 0, 0, 0);

            // Format datetime-local
            const pad = (n) => String(n).padStart(2, '0');
            valE = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${d.getDate()}T${pad(d.getHours())}:00`;
        }

        setTimeout(() => {
            if (valV || valE) {
                setStatus('Data berhasil diisi.');
                onFill({ vehicle: valV, entryTime: valE });
                setTimeout(onClose, 1500);
            } else {
                setStatus('Perintah tidak dimengerti.');
                setTranscript('');
                setListening(false);
            }
        }, 800);
    };

    const toggleListen = () => {
        if (listening) {
            recognitionRef.current?.stop();
        } else {
            setTranscript('');
            recognitionRef.current?.start();
        }
    };

    return (
        <div className="flex flex-col gap-3">
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                    <button
                        onClick={toggleListen}
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-inner-soft ${listening ? 'bg-indigo-100 text-indigo-600 animate-pulse-soft' : 'bg-slate-200 text-slate-500'}`}
                    >
                        {listening ? <Mic size={18} /> : <MicOff size={18} />}
                    </button>
                    <div>
                        <p className="text-[10px] font-bold tracking-widest uppercase text-slate-400 mb-0.5">Asisten AI</p>
                        <p className="text-sm font-semibold text-slate-800">{status}</p>
                    </div>
                </div>
                <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors">
                    <X size={16} />
                </button>
            </div>

            {transcript && (
                <div className="bg-white p-3 border border-slate-100 rounded-xl shadow-sm mt-1">
                    <p className="text-indigo-600 font-medium italic text-sm">{transcript}</p>
                </div>
            )}
        </div>
    );
}
