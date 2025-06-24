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
    selectedNodeIds,
    handleNodeSelection,
    clearSelection,
    setSelectedNodeIds,
    findNodeById,
    deleteSelectedNodes,
    hasUnsavedChanges
  } = useMindMapNodes();

  const nodeRefs = useRef({});
  const setNodeRef = useCallback((id, el) => {
    if (el) nodeRefs.current[id] = el;
    else delete nodeRefs.current[id];
  }, []);
  const leftPaneRef = useRef(null);
  const leftPanelWidth = useResizeObserver(leftPaneRef);
  const [draggingNodeInfo, setDraggingNodeInfo] = useState(null);
  const draggingNodeInfoRef = useRef(draggingNodeInfo);
  useEffect(() => {
    draggingNodeInfoRef.current = draggingNodeInfo;
  }, [draggingNodeInfo]);

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

  const handleNodeIsDragging = useCallback((dragInfo) => {
    if (dragInfo === null) {
      // Drag ended. Clear styles on all selected nodes to revert to transform-based positioning.
      const lastDraggingInfo = draggingNodeInfoRef.current;
      if (lastDraggingInfo) { // Use the last known dragging info
        Object.keys(lastDraggingInfo).forEach(nodeId => {
          const nodeEl = nodeRefs.current[nodeId];
          if (nodeEl) {
            nodeEl.style.left = '';
            nodeEl.style.top = '';
            // No need to reset transform, it's managed by React state
          }
        });
      }
      setDraggingNodeInfo(null);
      return;
    }

    const { id, x, y } = dragInfo; // new absolute position for dragged node

    const draggedNodeInState = findNodeById(nodes, id);
    if (!draggedNodeInState) return;

    const dx = x - draggedNodeInState.x;
    const dy = y - draggedNodeInState.y;

    const nodesToMove = selectedNodeIds.includes(id) ? selectedNodeIds : [id];

    // For arrow updates
    const newArrowDraggingInfo = {};
    
    nodesToMove.forEach(nodeId => {
        const node = findNodeById(nodes, nodeId);
        if (node) {
            const newX = node.x + dx;
            const newY = node.y + dy;
            newArrowDraggingInfo[nodeId] = { x: newX, y: newY };

            // Visually update node position
            const nodeEl = nodeRefs.current[nodeId];
            if (nodeEl) {
                // The primary dragged node is updated within its own component
                // for responsiveness. We only need to update the other nodes.
                if (nodeId !== id) {
                    nodeEl.style.left = `${newX}px`;
                    nodeEl.style.top = `${newY}px`;
                    nodeEl.style.transform = '';
                }
            }
        }
    });

    setDraggingNodeInfo(newArrowDraggingInfo);
  }, [nodes, selectedNodeIds, findNodeById]);

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
