import React, { useRef, useEffect, useCallback, useState } from 'react';
import './index.css';
import { useMindMapNodes } from './hooks/useMindMapNodes.js';
import { useMindMapArrows } from './hooks/useMindMapArrows.js';
import { useZoomAndPan } from './hooks/useZoomAndPan.js';
import { useResizeObserver } from './hooks/useResizeObserver.js';
import MindMapCanvas from './components/MindMapCanvas/MindMapCanvas.jsx';
import CanvasControls from './components/CanvasControls';

function App() {
  const canvasContainerRef = useRef(null); // Ref for the canvas container
  const canvasContentRef = useRef(null);
  const { 
    nodes, 
    addNode, 
    updateNodePosition, 
    handleTextChange,
    selectedNodeId,
    setSelectedNodeId
  } = useMindMapNodes();

  const nodeRefs = useRef({});
  const setNodeRef = useCallback((id, el) => {
    if (el) nodeRefs.current[id] = el;
    else delete nodeRefs.current[id];
  }, []);
  const leftPaneRef = useRef(null);
  const leftPanelWidth = useResizeObserver(leftPaneRef);
  const [draggingNodeInfo, setDraggingNodeInfo] = useState(null);

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



  return (
    <div className="app-container">
      <div 
        ref={leftPaneRef}
        className="left-pane"
      >
        <button className="save-button">Save</button>
        <button className="load-button">Load</button>
      </div>
      <MindMapCanvas 
        nodes={nodes}
        arrowData={arrowData}
        handleTextChange={handleTextChange}
        updateNodePosition={updateNodePosition}
        addNode={addNode}
        setNodeRef={setNodeRef}
        leftPanelWidth={leftPanelWidth}
        onNodeIsDragging={setDraggingNodeInfo}
        selectedNodeId={selectedNodeId}
        onNodeSelect={setSelectedNodeId}
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
