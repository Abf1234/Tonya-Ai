import { Outlet } from 'react-router-dom';

import Footer from '../components/Footer';
import NavBar from '../components/NavBar';

export default function MainLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#main-content"
        className="sr-only z-50 bg-guardian-950 px-4 py-3 text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to main content
      </a>
      <NavBar />
      <main id="main-content" className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
