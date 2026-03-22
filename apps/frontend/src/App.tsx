import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Header } from './components/Header';
import { DiscoveryPage } from './pages/DiscoveryPage';
import { CreateBucketPage } from './pages/CreateBucketPage';
import { BucketViewerPage } from './pages/BucketViewerPage';

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-surface-950 relative overflow-hidden">
        {/* Background ambient effects */}
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-600/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent-cyan/5 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10">
          <Header />
          <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
            <Routes>
              <Route path="/" element={<DiscoveryPage />} />
              <Route path="/create" element={<CreateBucketPage />} />
              <Route path="/bucket/:id" element={<BucketViewerPage />} />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
}
