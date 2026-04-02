import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import TopHeader from '../components/TopHeader';
import { sidebarStudentLinks } from '../data/mockData';

export default function StudentLayout() {
  return (
    <div>
      <Sidebar links={sidebarStudentLinks} portalName="Exam Control" portalSubtitle="Student Portal" />
      <main className="main-content">
        <TopHeader />
        <Outlet />
      </main>
    </div>
  );
}
