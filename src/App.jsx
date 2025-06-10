import React, { useRef, useEffect, useCallback, useState } from 'react';
import './index.css';
import Node from './components/Node';
import Arrow from './components/Arrow';
import { useMindMapNodes } from './hooks/useMindMapNodes.js'; // Import the custom hook
import { useMindMapArrows } from './hooks/useMindMapArrows.js'; // Import the arrow hook
import MindMapCanvas from './components/MindMapCanvas/MindMapCanvas.jsx'; // Import the new canvas component
import CanvasControls from './components/CanvasControls';

const MIN_ZOOM = 0.1; // 10%
const MAX_ZOOM = 2.0; // 200%

function App() {
  const canvasContentRef = useRef(null);
  const { 
    nodes, 
    addNode, 
    updateNodePosition, 
    handleTextChange,
    deleteNode, // Added deleteNode
    findNodeById,      // Now using this
    // findNodeAndAbsPos  // Available if needed
  } = useMindMapNodes();

  // Store refs to all node DOM elements by id
  const nodeRefs = useRef({});
  const setNodeRef = useCallback((id, el) => {
    if (el) nodeRefs.current[id] = el;
    else delete nodeRefs.current[id];
  }, []);
  const leftPaneRef = useRef(null);
  const [leftPanelWidth, setLeftPanelWidth] = useState(0);
  const [draggingNodeInfo, setDraggingNodeInfo] = useState(null);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(1); // Default zoom 100%
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const arrowData = useMindMapArrows(nodes, nodeRefs.current, draggingNodeInfo, zoomLevel, canvasContentRef);

  // Get the computed width from CSS
  useEffect(() => {
    const updateWidth = () => {
      if (leftPaneRef.current) {
        setLeftPanelWidth(leftPaneRef.current.offsetWidth);
      }
    };

    // Initial measurement
    updateWidth();
    
    // Set up resize observer for responsive adjustments
    const resizeObserver = new ResizeObserver(updateWidth);
    resizeObserver.observe(leftPaneRef.current);
    
    return () => {
      if (leftPaneRef.current) {
        resizeObserver.unobserve(leftPaneRef.current);
      }
      resizeObserver.disconnect();
    };
  }, []);

  // Effect to handle global key presses for node deletion
  useEffect(() => {
    const handleKeyDown = (event) => {
      const targetTagName = event.target.tagName.toLowerCase();
      // If the event is from an input or textarea, do nothing regarding node deletion flow
      if (targetTagName === 'input' || targetTagName === 'textarea') {
        return;
      }

      if (selectedNodeId && (event.key === 'Delete' || event.key === 'Backspace')) {
        // Prevent deleting the root node
        if (selectedNodeId === 'root') {
          return;
        }

        // Prevent default browser behavior for backspace (e.g., navigating back)
        // This is safe because we've already returned if the target was an input/textarea.
        if (event.key === 'Backspace') {
            event.preventDefault();
        }

        const nodeToConfirm = findNodeById(nodes, selectedNodeId);
        const confirmationMessage = nodeToConfirm
          ? `Are you sure you want to delete node "${nodeToConfirm.text}" and all its children?`
          : `Are you sure you want to delete node with ID "${selectedNodeId}" and all its children?`;

        if (window.confirm(confirmationMessage)) {
          deleteNode(selectedNodeId);
          setSelectedNodeId(null); // Clear selection after deletion
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedNodeId, deleteNode, nodes, findNodeById]); // Re-run if selectedNodeId, deleteNode, nodes, or findNodeById changes

  // Rendering logic for nodes and arrows is now handled by the MindMapCanvas component.
  // Helper functions like findNodeById are available from the useMindMapNodes hook if needed by other parts (not typically by App.jsx directly anymore).

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
        zoomLevel={zoomLevel} // Pass zoomLevel to MindMapCanvas
        canvasContentRef={canvasContentRef} // Pass the ref to MindMapCanvas
        panOffset={panOffset}
        setPanOffset={setPanOffset}
      />
      <CanvasControls 
        zoomLevel={zoomLevel}
        setZoomLevel={setZoomLevel}
        minZoom={MIN_ZOOM}
        maxZoom={MAX_ZOOM}
        setPanOffset={setPanOffset}
      />
    </div>
  );
}

export default App;
