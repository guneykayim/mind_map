import React, { useRef, useEffect, useCallback, useState } from 'react';
import './index.css';
import { useMindMapNodes } from './hooks/useMindMapNodes.js';
import { useMindMapArrows } from './hooks/useMindMapArrows.js';
import { useZoomAndPan } from './hooks/useZoomAndPan.js';
import { useResizeObserver } from './hooks/useResizeObserver.js';
import { useFileIO } from './hooks/useFileIO.js';
import MindMapCanvas from './components/MindMapCanvas/MindMapCanvas.jsx';
import CanvasControls from './components/CanvasControls';

function App() {
  const canvasContainerRef = useRef(null); // Ref for the canvas container
  const canvasContentRef = useRef(null);
  const [isJustLoaded, setIsJustLoaded] = useState(false);
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
  } = useMindMapNodes();

  const { handleExport, handleImport } = useFileIO({
    serialize,
    deserialize: (data) => {
      deserialize(data);
      setIsJustLoaded(true);
    },
    hasUnsavedChanges,
  });

  const nodeRefs = useRef({});
  const setNodeRef = useCallback((id, el) => {
    if (el) nodeRefs.current[id] = el;
    else delete nodeRefs.current[id];
  }, []);
  const leftPaneRef = useRef(null);
  const leftPanelWidth = useResizeObserver(leftPaneRef);

  const handleNodeIsDragging = useCallback((dragInfo) => {
    handleNodeDrag(dragInfo, nodeRefs.current);
  }, [handleNodeDrag]);

  const { 
    zoomLevel, 
    panOffset, 
    setPanOffset, 
    handleZoom, 
    resetView, 
    MIN_ZOOM, 
    MAX_ZOOM 
  } = useZoomAndPan(canvasContainerRef, nodes, nodeRefs);

  useEffect(() => {
    if (isJustLoaded) {
      resetView();
      setIsJustLoaded(false);
    }
  }, [isJustLoaded, resetView]);

  const arrowData = useMindMapArrows(nodes, nodeRefs.current, draggingNodeInfo, zoomLevel, canvasContentRef);

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

  return (
    <div className="app-container">
      <div 
        ref={leftPaneRef}
        className="left-pane"
      >
        <button className="save-button" onClick={handleExport}>Export</button>
        <button className="load-button" onClick={handleImport}>Import</button>
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
      />
    </div>
  );
}

export default App;
