import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import TopHeader from '../components/TopHeader';
import { sidebarSuperAdminLinks } from '../data/mockData';
import { useUIStore } from '../store/uiStore';

export default function SuperAdminLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const desktopSidebarCollapsed = useUIStore((s: any) => s.desktopSidebarCollapsed);

  return (
    <div>
      <Sidebar 
        links={sidebarSuperAdminLinks} 
        portalName="Platform Control" 
        portalSubtitle="Super Administrator" 
        isOpen={isMobileMenuOpen} 
        onClose={() => setIsMobileMenuOpen(false)} 
      />
      <main className={`main-content ${desktopSidebarCollapsed ? 'expanded' : ''}`}>
        <TopHeader title="SuperAdmin Panel" onMenuClick={() => setIsMobileMenuOpen(prev => !prev)} />
        <Outlet />
      </main>
    </div>
  );
}
