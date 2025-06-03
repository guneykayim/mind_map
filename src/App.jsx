import React, { useState, useRef, useEffect } from 'react';
import './index.css';
import Node from './components/Node';

function App() {
  const [nodeText, setNodeText] = useState('Root Node');
  const leftPaneRef = useRef(null);
  const [leftPanelWidth, setLeftPanelWidth] = useState(0);

  // Get the computed width from CSS
  useEffect(() => {
    if (leftPaneRef.current) {
      const updateWidth = () => {
        // Get the width directly from the computed style
        const width = window.getComputedStyle(leftPaneRef.current).width;
        setLeftPanelWidth(parseFloat(width));
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
    }
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
      <div className="mind-map">
        <Node 
          text={nodeText} 
          onTextChange={setNodeText}
          leftPanelWidth={leftPanelWidth}
        />
      </div>
    </div>
  );
}

export default App;
