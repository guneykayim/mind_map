import React, { useState, useRef, useEffect, useCallback } from 'react';
import './index.css';
import Node from './components/Node';
import Arrow from './components/Arrow';

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

  // State to store arrow data
  const [arrowData, setArrowData] = useState([]);

  // Function to find intersection point with a rectangle's edge
  const getEdgePoint = (rect, x, y) => {
    // Get center of the rectangle
    const centerX = rect.left + rect.width / 2 - leftPanelWidth;
    const centerY = rect.top + rect.height / 2;
    
    // Calculate direction vector from center to point
    let dx = x - centerX;
    let dy = y - centerY;
    
    // Calculate aspect ratio of the rectangle
    const aspect = rect.width / rect.height;
    
    // Calculate angle and normalize direction
    const angle = Math.atan2(dy, dx);
    
    // Calculate intersection with rectangle's edge
    let edgeX, edgeY;
    
    // Calculate the angle in the first octant (0 to 45 degrees)
    const octantAngle = Math.atan2(rect.height, rect.width);
    const absAngle = Math.abs(angle);
    
    // Determine which edge we intersect
    if (absAngle < octantAngle || absAngle > Math.PI - octantAngle) {
      // Right or left edge
      const sign = Math.sign(Math.cos(angle));
      edgeX = centerX + sign * rect.width / 2;
      edgeY = centerY + Math.tan(angle) * (edgeX - centerX);
    } else {
      // Top or bottom edge
      const sign = Math.sign(Math.sin(angle));
      edgeY = centerY + sign * rect.height / 2;
      edgeX = centerX + (edgeY - centerY) / Math.tan(angle);
      
      // Handle vertical lines (tan(90°) is infinite)
      if (Math.abs(Math.cos(angle)) < 0.001) {
        edgeX = centerX;
      }
    }
    
    return { x: edgeX, y: edgeY };
  };

  // Update arrows when nodes or refs change
  useEffect(() => {
    const calculateArrows = () => {
      const newArrows = [];
      const processed = new Set();
      
      const processNode = (node, currentX = 0, currentY = 0) => {
        if (!node || !node.children) return;
        
        const nodeX = currentX + (node.x || 0);
        const nodeY = currentY + (node.y || 0);
        
        node.children.forEach(child => {
          const childId = child.id;
          const arrowId = `${node.id}-${childId}`;
          
          if (processed.has(arrowId)) return;
          
          const parentEl = nodeRefs.current[node.id];
          const childEl = nodeRefs.current[childId];
          
          if (parentEl && childEl) {
            const parentRect = parentEl.getBoundingClientRect();
            const childRect = childEl.getBoundingClientRect();
            
            // Get center points
            const parentCenterX = parentRect.left + parentRect.width / 2 - leftPanelWidth;
            const parentCenterY = parentRect.top + parentRect.height / 2;
            const childCenterX = childRect.left + childRect.width / 2 - leftPanelWidth;
            const childCenterY = childRect.top + childRect.height / 2;
            
            // Calculate direction from parent to child
            const dx = childCenterX - parentCenterX;
            const dy = childCenterY - parentCenterY;
            const length = Math.sqrt(dx * dx + dy * dy);
            
            if (length > 0) {
              // Calculate edge points
              const startPoint = getEdgePoint(parentRect, childCenterX, childCenterY);
              const endPoint = getEdgePoint(childRect, parentCenterX, parentCenterY);
              
              newArrows.push({
                id: arrowId,
                from: startPoint,
                to: endPoint
              });
              
              processed.add(arrowId);
            }
          }
          
          if (child && child.children) {
            processNode(child, nodeX, nodeY);
          }
        });
      };
      
      nodes.forEach(node => processNode(node));
      setArrowData(newArrows);
    };
    
    // Use requestAnimationFrame to ensure DOM is updated
    const frameId = requestAnimationFrame(() => {
      calculateArrows();
    });
    
    return () => cancelAnimationFrame(frameId);
  }, [nodes, leftPanelWidth]);
  
  // Function to render arrows (now just maps over arrowData)
  const renderArrows = () => {
    return arrowData;
  };

  // Helper function to find a node by ID
  const findNodeById = (nodeList, nodeId) => {
    for (const node of nodeList) {
      if (node.id === nodeId) return node;
      if (node.children) {
        const found = findNodeById(node.children, nodeId);
        if (found) return found;
      }
    }
    return null;
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
          {renderArrows().map(arrow => (
            <Arrow key={arrow.id} from={arrow.from} to={arrow.to} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;
