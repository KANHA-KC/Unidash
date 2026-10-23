import React from 'react';
import { TopNavBar } from '../navigation/TopNavBar';
import { LeftSidebar } from '../navigation/LeftSidebar';
import { CanvasGrid } from '../canvas/CanvasGrid';
import { RightInspector } from '../inspector/RightInspector';
import { AICommandBar } from '../navigation/AICommandBar';

interface EditorViewProps {
  onOpenTemplatesModal: () => void;
  onOpenDataSourceModal: () => void;
  onOpenPublishModal: () => void;
}

export const EditorView: React.FC<EditorViewProps> = ({
  onOpenTemplatesModal,
  onOpenDataSourceModal,
  onOpenPublishModal,
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <TopNavBar
        onOpenPublishModal={onOpenPublishModal}
        onOpenTemplatesModal={onOpenTemplatesModal}
      />

      <div className="studio-container">
        <LeftSidebar
          onOpenTemplatesModal={onOpenTemplatesModal}
          onOpenDataSourceModal={onOpenDataSourceModal}
        />

        <CanvasGrid />

        <RightInspector />

        <AICommandBar />
      </div>
    </div>
  );
};
