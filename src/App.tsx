import React from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Compass, Map as MapIcon, PlusSquare, User } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { AppProvider } from './context/AppContext';

// Import Pages
import Discovery from './pages/Discovery';
import PlaceDetail from './pages/PlaceDetail';
import Planner from './pages/Planner';
import AICreator from './pages/AICreator';
import TripDetail from './pages/TripDetail';
import MapScreen from './pages/MapScreen';
import Profile from './pages/Profile';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function MainLayout() {
  const location = useLocation();
  const hideNavRoutes = ['/place/', '/plan/new', '/plan/detail/'];
  const shouldHideNav = 
    hideNavRoutes.some(path => location.pathname.includes(path)) ||
    (location.pathname === '/map' && location.search.includes('routing=true'));
  
  return (
    <div className="h-screen w-full bg-slate-200 flex justify-center relative overflow-hidden font-sans">
      <div className="w-full sm:w-[414px] h-full bg-slate-50 relative flex flex-col shadow-2xl sm:ring-1 sm:ring-slate-900/5 overflow-hidden object-cover">
        
        {/* Main View Area */}
        <div className="flex-1 overflow-hidden relative rounded-b-[40px] bg-slate-50 z-10">
          <AnimatePresence mode="wait">
            {/* @ts-ignore */}
            <Routes location={location} key={location.pathname}>
              <Route path="/" element={<Discovery />} />
              <Route path="/place/:id" element={<PlaceDetail />} />
              <Route path="/plan" element={<Planner />} />
              <Route path="/plan/new" element={<AICreator />} />
              <Route path="/plan/detail/:id" element={<TripDetail />} />
              <Route path="/map" element={<MapScreen />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="*" element={<Discovery />} />
            </Routes>
          </AnimatePresence>
        </div>

        {/* Bottom Navigation Floating */}
        <AnimatePresence>
          {!shouldHideNav && (
            <motion.div 
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
              className="absolute bottom-0 w-full px-6 pb-8 pt-4 pointer-events-none z-30"
            >
              <div className="frosted-glass rounded-[28px] h-[72px] flex items-center justify-around px-2 pointer-events-auto border border-white/60 shadow-soft">
                <NavItem to="/" icon={<Compass size={24} />} title="Khám phá" />
                <NavItem to="/map" icon={<MapIcon size={24} />} title="Bản đồ" />
                <NavItem to="/plan" icon={<PlusSquare size={24} />} title="Kế hoạch" />
                <NavItem to="/profile" icon={<User size={24} />} title="Cá nhân" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function NavItem({ to, icon, title }: { to: string, icon: React.ReactNode, title: string }) {
  const location = useLocation();
  const isActive = location.pathname === to || (to === '/' && !['/plan', '/map', '/profile'].includes(location.pathname));
  const navigate = useNavigate();

  return (
    <button 
      onClick={() => navigate(to)}
      className="relative flex flex-col items-center justify-center w-16 h-full group"
      aria-label={title}
    >
      <div className={cn(
        "transition-all duration-300 ease-out flex flex-col items-center",
        isActive ? "-translate-y-1.5 text-indigo-600" : "text-slate-400 group-hover:text-slate-600"
      )}>
        <div className={cn("transition-transform duration-300", isActive && "scale-110")}>
          {icon}
        </div>
      </div>
      
      {isActive && (
        <motion.div 
          layoutId="nav-indicator"
          className="absolute bottom-[10px] w-1.5 h-1.5 rounded-full bg-indigo-600"
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />
      )}
    </button>
  );
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <MainLayout />
      </BrowserRouter>
    </AppProvider>
  );
}

