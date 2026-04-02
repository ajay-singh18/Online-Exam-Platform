import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import TopHeader from '../components/TopHeader';
import { sidebarAdminLinks } from '../data/mockData';

export default function AdminLayout() {
  return (
    <div>
      <Sidebar links={sidebarAdminLinks} portalName="Exam Control" portalSubtitle="Administrator" />
      <main className="main-content">
        <TopHeader title="Admin Panel" />
        <Outlet />
      </main>
    </div>
  );
}
