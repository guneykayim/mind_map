import React, { useRef, useEffect, useCallback, useState } from 'react';
import './index.css';
import Node from './components/Node';
import Arrow from './components/Arrow';
import { useMindMapNodes } from './hooks/useMindMapNodes.js'; // Import the custom hook
import { useMindMapArrows } from './hooks/useMindMapArrows.js'; // Import the arrow hook
import MindMapCanvas from './components/MindMapCanvas/MindMapCanvas.jsx'; // Import the new canvas component

function App() {
  const { 
    nodes, 
    addNode, 
    updateNodePosition, 
    handleTextChange,
    // findNodeById,      // Available if needed
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
  const arrowData = useMindMapArrows(nodes, nodeRefs.current, leftPanelWidth, draggingNodeInfo);

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
      />
    </div>
  );
}

export default App;
