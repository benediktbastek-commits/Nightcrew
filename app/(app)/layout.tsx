import { TabBar } from '@/components/tab-bar';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="stage">
      <div className="app">
        {children}
        <TabBar />
      </div>
    </div>
  );
}
