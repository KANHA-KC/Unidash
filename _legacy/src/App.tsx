import React, { useState } from 'react';
import { DashboardProvider, useDashboard } from './context/DashboardContext';
import { HomeView } from './components/views/HomeView';
import { EditorView } from './components/views/EditorView';
import { PublishedView } from './components/views/PublishedView';
import { TemplateGalleryModal } from './components/modals/TemplateGalleryModal';
import { DataSourceModal } from './components/modals/DataSourceModal';
import { PublishModal } from './components/modals/PublishModal';

const AppContent: React.FC = () => {
  const { activeView } = useDashboard();
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);
  const [isDataSourceOpen, setIsDataSourceOpen] = useState(false);
  const [isPublishOpen, setIsPublishOpen] = useState(false);

  return (
    <>
      {activeView === 'home' && (
        <HomeView onOpenTemplatesModal={() => setIsTemplatesOpen(true)} />
      )}

      {activeView === 'editor' && (
        <EditorView
          onOpenTemplatesModal={() => setIsTemplatesOpen(true)}
          onOpenDataSourceModal={() => setIsDataSourceOpen(true)}
          onOpenPublishModal={() => setIsPublishOpen(true)}
        />
      )}

      {activeView === 'published' && (
        <PublishedView onOpenPublishModal={() => setIsPublishOpen(true)} />
      )}

      {/* Global Apple Sheets / Modals */}
      <TemplateGalleryModal
        isOpen={isTemplatesOpen}
        onClose={() => setIsTemplatesOpen(false)}
      />

      <DataSourceModal
        isOpen={isDataSourceOpen}
        onClose={() => setIsDataSourceOpen(false)}
      />

      <PublishModal
        isOpen={isPublishOpen}
        onClose={() => setIsPublishOpen(false)}
      />
    </>
  );
};

export const App: React.FC = () => {
  return (
    <DashboardProvider>
      <AppContent />
    </DashboardProvider>
  );
};

export default App;
