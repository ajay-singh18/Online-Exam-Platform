import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import TopHeader from '../components/TopHeader';
import { sidebarAdminLinks } from '../data/mockData';
import { useUIStore } from '../store/uiStore';

export default function AdminLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const desktopSidebarCollapsed = useUIStore((s: any) => s.desktopSidebarCollapsed);
  
  return (
    <div>
      <Sidebar 
        links={sidebarAdminLinks} 
        portalName="Exam Control" 
        portalSubtitle="Administrator" 
        isOpen={isMobileMenuOpen} 
        onClose={() => setIsMobileMenuOpen(false)} 
      />
      <main className={`main-content ${desktopSidebarCollapsed ? 'expanded' : ''}`}>
        <TopHeader title="Admin Panel" onMenuClick={() => setIsMobileMenuOpen(prev => !prev)} />
        <Outlet />
      </main>
    </div>
  );
}
