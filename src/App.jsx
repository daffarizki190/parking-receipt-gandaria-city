import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { Home as HomeIcon, BarChart2, Zap } from 'lucide-react';
import HomePage from './pages/Home';
import HistoryPage from './pages/History';

function Header() {
    return (
        <header className="flex flex-col items-center pt-8 pb-4 anim-slide-up">
            {/* Badge */}
            <div className="flex items-center gap-2 mb-4">
                <div className="chip chip-indigo">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                    GANDARIA CITY
                </div>
            </div>

            {/* Logo */}
            <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-500 flex items-center justify-center shadow-md flex-shrink-0">
                    <Zap size={20} className="text-white" fill="white" />
                </div>
                <div>
                    <h1 className="text-2xl font-black tracking-tight text-slate-800" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                        ParkMate<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-sky-500"> Gancit</span>
                    </h1>
                    <p className="text-[11px] text-slate-400 font-bold tracking-widest uppercase mt-0.5">Smart Parking System</p>
                </div>
            </div>
        </header>
    );
}

function BottomNav() {
    const location = useLocation();
    const isHistory = location.pathname === '/history';

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 bottom-nav">
            <Link to="/" className={`bottom-nav-btn ${!isHistory ? 'active' : ''}`}>
                <HomeIcon size={20} strokeWidth={isHistory ? 2 : 2.5} />
                <span>Kalkulator</span>
            </Link>
            <Link to="/history" className={`bottom-nav-btn ${isHistory ? 'active' : ''}`}>
                <BarChart2 size={20} strokeWidth={!isHistory ? 2 : 2.5} />
                <span>Dashboard</span>
            </Link>
        </nav>
    );
}

export default function App() {
    return (
        <>
            {/* Animated Background */}
            <div className="bg-scene" aria-hidden="true">
                <div className="blob blob-1" />
                <div className="blob blob-2" />
                <div className="blob blob-3" />
            </div>
            <div className="grid-overlay" aria-hidden="true" />

            {/* Content */}
            <div className="relative z-10 min-h-screen max-w-xl mx-auto px-4 pb-28" style={{ fontFamily: 'Inter, sans-serif' }}>
                <Header />
                <main>
                    <Routes>
                        <Route path="/" element={<HomePage />} />
                        <Route path="/history" element={<HistoryPage />} />
                    </Routes>
                </main>
                <footer className="mt-10 text-center text-slate-400 text-[10px] font-medium tracking-wide pb-2 uppercase">
                    <p>© {new Date().getFullYear()} Daffa Rizki Ariyanto · Gandaria City</p>
                </footer>
            </div>

            <BottomNav />
        </>
    );
}
