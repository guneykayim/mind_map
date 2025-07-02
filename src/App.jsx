import React, { useRef, useEffect, useCallback, useState } from 'react';
import './index.css';
import { useMindMapNodes } from './hooks/useMindMapNodes.js';
import { useMindMapArrows } from './hooks/useMindMapArrows.js';
import { useZoomAndPan } from './hooks/useZoomAndPan.js';
import { useResizeObserver } from './hooks/useResizeObserver.js';
import { useFileIO } from './hooks/useFileIO.js';
import { exportAsPng } from './utils/exportUtils.js';
import MindMapCanvas from './components/MindMapCanvas/MindMapCanvas.jsx';
import CanvasControls from './components/CanvasControls';
import Button from './components/Button';
import Tips from './components/Tips';
import ConfirmationDialog from './components/ConfirmationDialog';

function App() {
  const canvasContainerRef = useRef(null); // Ref for the canvas container
  const canvasContentRef = useRef(null);
  const [isJustLoaded, setIsJustLoaded] = useState(false);
  const [confirmation, setConfirmation] = useState({ isOpen: false });

  const showConfirmation = (title, message, onConfirm) => {
    setConfirmation({
      isOpen: true,
      title,
      message,
      onConfirm,
    });
  };

  const closeConfirmation = () => {
    setConfirmation({ isOpen: false });
  };

  const { 
    nodes, 
    addNode, 
    updateNodePosition, 
    handleTextChange,
    selectedNodeIds,
    handleNodeSelection,
    clearSelection,
    setSelectedNodeIds,
    findNodeById,
    deleteSelectedNodes,
    hasUnsavedChanges,
    draggingNodeInfo,
    handleNodeDrag,
    serialize,
    deserialize,
    totalNodeCount,
    clearCanvas,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useMindMapNodes(showConfirmation);

  const nodeRefs = useRef({});
  const setNodeRef = useCallback((id, el) => {
    if (el) nodeRefs.current[id] = el;
    else delete nodeRefs.current[id];
  }, []);

  const { 
    zoomLevel, 
    panOffset, 
    setPanOffset, 
    handleZoom, 
    resetView, 
    MIN_ZOOM, 
    MAX_ZOOM 
  } = useZoomAndPan(canvasContainerRef, nodes, nodeRefs);

  const arrowData = useMindMapArrows(nodes, nodeRefs.current, draggingNodeInfo, zoomLevel, canvasContentRef);

  const { handleExport, handleImport } = useFileIO({
    serialize,
    deserialize: (data) => {
      deserialize(data);
      setIsJustLoaded(true);
    },
    hasUnsavedChanges,
  });

  const handleExportAsPng = () => {
    exportAsPng(canvasContentRef, nodes, arrowData, nodeRefs.current);
  }

  const handleClearCanvas = () => {
    showConfirmation(
      'Clear Canvas',
      'Are you sure you want to clear the canvas? This action cannot be undone.',
      clearCanvas
    );
  };

  const leftPaneRef = useRef(null);
  const leftPanelWidth = useResizeObserver(leftPaneRef);

  const handleNodeIsDragging = useCallback((dragInfo) => {
    handleNodeDrag(dragInfo, nodeRefs.current);
  }, [handleNodeDrag]);

  useEffect(() => {
    if (isJustLoaded) {
      resetView();
      setIsJustLoaded(false);
    }
  }, [isJustLoaded, resetView]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Shift') {
        document.body.classList.add('shift-pressed');
      }
    };
    const handleKeyUp = (e) => {
      if (e.key === 'Shift') {
        document.body.classList.remove('shift-pressed');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      document.body.classList.remove('shift-pressed'); // cleanup on unmount
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.key === 'z') {
        e.preventDefault();
        if (canUndo) {
          undo();
        }
      } else if (e.ctrlKey && e.key === 'y') {
        e.preventDefault();
        if (canRedo) {
          redo();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [undo, redo, canUndo, canRedo]);

  const ExportIcon = <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>;
  const ImportIcon = <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>;
  const PngIcon = <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>;
  const ClearIcon = <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>;

  return (
    <div className="app-container">
      <div 
        ref={leftPaneRef}
        className="left-pane"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
          <Button onClick={handleImport} icon={ImportIcon} variant="primary">Import</Button>
          <Button onClick={handleExport} icon={ExportIcon} variant="primary">Export</Button>
          <Button onClick={handleExportAsPng} icon={PngIcon} variant="primary">Export as PNG</Button>
          <Button onClick={handleClearCanvas} icon={ClearIcon} variant="danger">Clear</Button>
        </div>
        <Tips />
      </div>
      <MindMapCanvas 
        nodes={nodes}
        arrowData={arrowData}
        handleTextChange={handleTextChange}
        updateNodePosition={updateNodePosition}
        addNode={addNode}
        setNodeRef={setNodeRef}
        leftPanelWidth={leftPanelWidth}
        onNodeIsDragging={handleNodeIsDragging}
        selectedNodeIds={selectedNodeIds}
        onNodeSelect={handleNodeSelection}
        onCanvasClick={clearSelection}
        onSetSelectedNodeIds={setSelectedNodeIds}
        nodeRefs={nodeRefs.current}
        zoomLevel={zoomLevel}
        panOffset={panOffset}
        setPanOffset={setPanOffset}
        onZoom={handleZoom}
        canvasContainerRef={canvasContainerRef}
        canvasContentRef={canvasContentRef}
      />
      <CanvasControls 
        zoomLevel={zoomLevel}
        onZoom={handleZoom}
        minZoom={MIN_ZOOM}
        maxZoom={MAX_ZOOM}
        onResetPan={resetView}
        onUndo={undo}
        onRedo={redo}
        canUndo={canUndo}
        canRedo={canRedo}
      />
      <ConfirmationDialog
        isOpen={confirmation.isOpen}
        onClose={closeConfirmation}
        onConfirm={confirmation.onConfirm}
        title={confirmation.title}
        message={confirmation.message}
      />
    </div>
  );
}

export default App;
