import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import TopHeader from '../components/TopHeader';
import { sidebarStudentLinks } from '../data/mockData';

export default function StudentLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  return (
    <div>
      <Sidebar 
        links={sidebarStudentLinks} 
        portalName="Exam Control" 
        portalSubtitle="Student Portal" 
        isOpen={isMobileMenuOpen} 
        onClose={() => setIsMobileMenuOpen(false)} 
      />
      <main className="main-content">
        <TopHeader onMenuClick={() => setIsMobileMenuOpen(prev => !prev)} />
        <Outlet />
      </main>
    </div>
  );
}
