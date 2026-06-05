import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import TopHeader from '../components/TopHeader';
import { sidebarStudentLinks } from '../data/mockData';
import { useUIStore } from '../store/uiStore';

export default function StudentLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const desktopSidebarCollapsed = useUIStore((s: any) => s.desktopSidebarCollapsed);
  
  return (
    <div>
      <Sidebar 
        links={sidebarStudentLinks} 
        portalName="Exam Control" 
        portalSubtitle="Student Portal" 
        isOpen={isMobileMenuOpen} 
        onClose={() => setIsMobileMenuOpen(false)} 
      />
      <main className={`main-content ${desktopSidebarCollapsed ? 'expanded' : ''}`}>
        <TopHeader onMenuClick={() => setIsMobileMenuOpen(prev => !prev)} />
        <Outlet />
      </main>
    </div>
  );
}
