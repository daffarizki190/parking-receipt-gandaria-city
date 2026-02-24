import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { Home, History as HistoryIcon } from 'lucide-react';

function Header() {
    const location = useLocation();
    const isHistory = location.pathname === '/history';

    return (
        <header className="flex flex-col items-center justify-center pt-10 pb-6 slide-in-bottom">
            <div className="text-accent text-sm font-bold tracking-[0.2em] mb-2 px-3 py-1 bg-surface border border-white/10 rounded-full">
                GANDARIA CITY
            </div>
            <h1 className="text-white text-4xl sm:text-5xl font-extrabold mb-2 text-glow">
                Parkmate Gancit
            </h1>
            <p className="text-slate-400 text-sm font-medium">
                Sistem Parkir Cerdas — Tenaga AI
            </p>

            <nav className="mt-6 flex gap-2 p-1.5 bg-white/5 border border-white/10 rounded-2xl w-full max-w-sm">
                <Link
                    to="/"
                    className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-medium transition-all ${!isHistory ? 'bg-primary text-white shadow-lg shadow-primary/40' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                >
                    <Home size={16} /> Kalkulator
                </Link>
                <Link
                    to="/history"
                    className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-medium transition-all ${isHistory ? 'bg-primary text-white shadow-lg shadow-primary/40' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                >
                    <HistoryIcon size={16} /> Dashboard
                </Link>
            </nav>
        </header>
    );
}

function MainLayout({ children }) {
    return (
        <>
            <div className="bg-animated" aria-hidden="true">
                <div className="blob shape-1"></div>
                <div className="blob shape-2"></div>
                <div className="blob shape-3"></div>
            </div>
            <div className="min-h-screen p-4 sm:p-6 pb-20 max-w-2xl mx-auto relative z-10 font-outfit">
                <Header />
                <main className="min-h-[50vh]">
                    {children}
                </main>
                <footer className="mt-12 text-center text-slate-500 text-sm">
                    <p>© 2025 Daffa Rizki Ariyanto • Gandaria City</p>
                </footer>
            </div>
        </>
    );
}

// Temporary placeholders until we build the actual pages
const HomePlaceholder = () => <div className="glass-card p-6 rounded-3xl text-center text-slate-300">Form Kalkulator akan dimigrasi di sini.</div>;
const HistoryPlaceholder = () => <div className="glass-card p-6 rounded-3xl text-center text-slate-300">Dashboard Riwayat akan dimigrasi di sini.</div>;

export default function App() {
    return (
        <MainLayout>
            <Routes>
                <Route path="/" element={<HomePlaceholder />} />
                <Route path="/history" element={<HistoryPlaceholder />} />
            </Routes>
        </MainLayout>
    );
}
