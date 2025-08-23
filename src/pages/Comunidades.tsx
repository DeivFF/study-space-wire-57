import { Layout } from '@/components/Layout';
import { CommunityHeader } from '@/components/Community/CommunityHeader';
import { CommunityGrid } from '@/components/Community/CommunityGrid';
import { CommunityDetail } from '@/components/Community/CommunityDetail';
import { CommunityRightSidebar } from '@/components/Community/CommunityRightSidebar';
import { CreateCommunityModal } from '@/components/Community/CreateCommunityModal';
import { CreateThreadModal } from '@/components/Community/CreateThreadModal';
import { useState } from 'react';

export default function Comunidades() {
  const [view, setView] = useState<'list' | 'detail'>('list');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showThreadModal, setShowThreadModal] = useState(false);

  return (
    <>
      <Layout>
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4 p-4">
          <main className="space-y-4">
            {view === 'list' ? (
              <>
                <CommunityHeader onCreateCommunity={() => setShowCreateModal(true)} />
                <CommunityGrid onViewCommunity={() => setView('detail')} />
              </>
            ) : (
              <CommunityDetail 
                onBack={() => setView('list')}
                onCreateThread={() => setShowThreadModal(true)}
              />
            )}
          </main>
          
          <aside className="hidden lg:block">
            <CommunityRightSidebar showCommunityDetails={view === 'detail'} />
          </aside>
        </div>
      </Layout>
      
      <CreateCommunityModal 
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          setShowCreateModal(false);
          setView('detail');
        }}
      />
      
      <CreateThreadModal 
        open={showThreadModal}
        onClose={() => setShowThreadModal(false)}
      />
    </>
  );
}