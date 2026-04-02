import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import TopHeader from '../components/TopHeader';
import { sidebarSuperAdminLinks } from '../data/mockData';

export default function SuperAdminLayout() {
  return (
    <div>
      <Sidebar links={sidebarSuperAdminLinks} portalName="Platform Control" portalSubtitle="Super Administrator" />
      <main className="main-content">
        <TopHeader title="SuperAdmin Panel" />
        <Outlet />
      </main>
    </div>
  );
}
