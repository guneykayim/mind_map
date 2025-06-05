import React, { useState, useRef, useEffect, useCallback } from 'react';
import './index.css';
import Node from './components/Node';

// Generate a simple unique ID
const generateId = () => Math.random().toString(36).substr(2, 9);

// Initial node structure
const initialNodes = [
  {
    id: 'root',
    text: 'Root Node',
    x: 0,
    y: 0,
    children: []
  }
];

function App() {
  // Store refs to all node DOM elements by id
  const nodeRefs = useRef({});
  const setNodeRef = useCallback((id, el) => {
    if (el) nodeRefs.current[id] = el;
    else delete nodeRefs.current[id];
  }, []);
  const [nodes, setNodes] = useState(initialNodes);
  const leftPaneRef = useRef(null);
  const [leftPanelWidth, setLeftPanelWidth] = useState(0);

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

  // Function to add a new node
  // Helper to find a node by ID and return its absolute position
  const findNodeAndAbsPos = (nodeId, nodeList = nodes, parentAbs = {x:0, y:0}) => {
    for (const node of nodeList) {
      const absX = parentAbs.x + (node.x || 0);
      const absY = parentAbs.y + (node.y || 0);
      if (node.id === nodeId) {
        return { node, absX, absY };
      }
      if (node.children && node.children.length > 0) {
        const found = findNodeAndAbsPos(nodeId, node.children, {x: absX, y: absY});
        if (found) return found;
      }
    }
    return null;
  };

  const addNode = useCallback((parentId, direction, dims = {}) => {
    const newId = generateId();
    // Default child size if not known
    const defaultChildWidth = 120;
    const defaultChildHeight = 60;
    const parentWidth = dims.parentWidth || defaultChildWidth;
    const parentHeight = dims.parentHeight || defaultChildHeight;
    let x = 0, y = 0;

    switch (direction) {
      case 'right':
        x = parentWidth + 80;
        y = 0;
        break;
      case 'left':
        x = -(parentWidth + 80);
        y = 0;
        break;
      case 'top':
        x = 0;
        y = -(parentHeight + 80);
        break;
      case 'bottom':
        x = 0;
        y = parentHeight + 80;
        break;
      default:
        x = parentWidth + 80;
        y = 0;
    }

    setNodes(prevNodes => {
      // Find parent state position for delta calculation
      function findParent(nodeList) {
        for (const node of nodeList) {
          if (node.id === parentId) return node;
          if (node.children) {
            const found = findParent(node.children);
            if (found) return found;
          }
        }
        return null;
      }
      const parentNode = findParent(prevNodes);
      let deltaX = 0, deltaY = 0;
      if (parentNode && typeof dims.latestX === 'number' && typeof dims.latestY === 'number') {
        deltaX = dims.latestX - (parentNode.x || 0);
        deltaY = dims.latestY - (parentNode.y || 0);
      }
      const updateNode = (nodes) => nodes.map(node => {
        if (node.id === parentId) {
          const newNode = {
            id: newId,
            text: 'New Node',
            x: x + deltaX,
            y: y + deltaY,
            children: []
          };
          return {
            ...node,
            children: [...(node.children || []), newNode]
          };
        }
        if (node.children && node.children.length > 0) {
          return {
            ...node,
            children: updateNode(node.children)
          };
        }
        return node;
      });
      return updateNode(prevNodes);
    });
  }, [nodes]);

  // Update node position
  const updateNodePosition = useCallback((nodeId, x, y) => {
    setNodes(prevNodes => {
      const updatePos = (nodes) => nodes.map(node => {
        if (node.id === nodeId) {
          return { ...node, x, y };
        }
        if (node.children && node.children.length > 0) {
          return {
            ...node,
            children: updatePos(node.children)
          };
        }
        return node;
      });
      return updatePos(prevNodes);
    });
  }, []);

  // Handler to update node text
  const handleTextChange = (id, newText) => {
    setNodes(prevNodes => {
      function update(nodes) {
        return nodes.map(node => {
          if (node.id === id) {
            return { ...node, text: newText };
          }
          if (node.children) {
            return { ...node, children: update(node.children) };
          }
          return node;
        });
      }
      return update(prevNodes);
    });
  };

  // Recursive rendering of nodes
  const renderNodeElements = (nodeList = nodes, parentX = 0, parentY = 0) => {
    return nodeList.map(node => {
      const nodeX = parentX + (node.x || 0);
      const nodeY = parentY + (node.y || 0);
      return (
        <React.Fragment key={node.id}>
          <Node
            id={node.id}
            text={node.text}
            position={{ x: nodeX, y: nodeY }}
            onTextChange={newText => handleTextChange(node.id, newText)}
            onPositionChange={(x, y) => updateNodePosition(node.id, x - parentX, y - parentY)}
            onAddNode={addNode}
            leftPanelWidth={leftPanelWidth}
            setNodeRef={el => setNodeRef(node.id, el)}
          />
          {node.children && node.children.length > 0 && renderNodeElements(node.children, nodeX, nodeY)}
        </React.Fragment>
      );
    });
  };



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
        <div className="node-layer">
          {renderNodeElements()}
        </div>
      </div>
    </div>
  );
}

export default App;
