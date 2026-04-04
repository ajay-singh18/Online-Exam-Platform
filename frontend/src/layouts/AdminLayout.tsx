import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import TopHeader from '../components/TopHeader';
import { sidebarAdminLinks } from '../data/mockData';

export default function AdminLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  return (
    <div>
      <Sidebar 
        links={sidebarAdminLinks} 
        portalName="Exam Control" 
        portalSubtitle="Administrator" 
        isOpen={isMobileMenuOpen} 
        onClose={() => setIsMobileMenuOpen(false)} 
      />
      <main className="main-content">
        <TopHeader title="Admin Panel" onMenuClick={() => setIsMobileMenuOpen(prev => !prev)} />
        <Outlet />
      </main>
    </div>
  );
}
