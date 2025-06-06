import { useState, useEffect } from 'react';

// Function to find intersection point with a rectangle's edge
const getEdgePoint = (rect, targetX, targetY, panelWidthOffset = 0) => {
  // Get center of the rectangle, adjusted by panelWidthOffset if necessary
  const rectCenterX = rect.left + rect.width / 2 - panelWidthOffset;
  const rectCenterY = rect.top + rect.height / 2;

  // Vector from rectangle center to target point
  let dx = targetX - rectCenterX;
  let dy = targetY - rectCenterY;

  // If dx and dy are zero, target is at the center, no clear edge point, return center
  if (dx === 0 && dy === 0) return { x: rectCenterX, y: rectCenterY };

  let t = Infinity;

  // Check intersection with vertical edges (left and right)
  if (dx !== 0) {
    const tX1 = (rect.left - panelWidthOffset - rectCenterX) / dx;
    const tX2 = (rect.right - panelWidthOffset - rectCenterX) / dx;
    // Intersection Y coordinates
    const yAtTX1 = rectCenterY + tX1 * dy;
    const yAtTX2 = rectCenterY + tX2 * dy;

    if (tX1 >= 0 && tX1 <= 1 && yAtTX1 >= rect.top && yAtTX1 <= rect.bottom) t = Math.min(t, tX1);
    if (tX2 >= 0 && tX2 <= 1 && yAtTX2 >= rect.top && yAtTX2 <= rect.bottom) t = Math.min(t, tX2);
  }

  // Check intersection with horizontal edges (top and bottom)
  if (dy !== 0) {
    const tY1 = (rect.top - rectCenterY) / dy;
    const tY2 = (rect.bottom - rectCenterY) / dy;
    // Intersection X coordinates
    const xAtTY1 = rectCenterX + tY1 * dx;
    const xAtTY2 = rectCenterX + tY2 * dx;

    if (tY1 >= 0 && tY1 <= 1 && xAtTY1 >= rect.left - panelWidthOffset && xAtTY1 <= rect.right - panelWidthOffset) t = Math.min(t, tY1);
    if (tY2 >= 0 && tY2 <= 1 && xAtTY2 >= rect.left - panelWidthOffset && xAtTY2 <= rect.right - panelWidthOffset) t = Math.min(t, tY2);
  }

  // If t is still Infinity, something went wrong, or target is inside and parallel lines don't intersect edge in direction.
  // Fallback to a simple heuristic or center if no valid intersection found.
  if (t === Infinity || t > 1) { // t > 1 means intersection point is outside the segment from center to target
    // This part might need refinement based on how nodes are positioned relative to each other.
    // A common fallback is to find the closest point on the boundary.
    // For now, let's use a simple approach: if target is mostly horizontal from center, pick horizontal edge, else vertical.
    if (Math.abs(dx) > Math.abs(dy)) { // More horizontal
        return { x: (dx > 0 ? rect.right : rect.left) - panelWidthOffset, y: rectCenterY };
    } else { // More vertical
        return { x: rectCenterX, y: (dy > 0 ? rect.bottom : rect.top) };
    }
  }

  return {
    x: rectCenterX + t * dx,
    y: rectCenterY + t * dy
  };
};

export const useMindMapArrows = (nodes, nodeRefs, leftPanelWidth) => {
  const [arrowData, setArrowData] = useState([]);

  useEffect(() => {
    const calculateArrows = () => {
      if (!nodes || !nodeRefs) return;
      const newArrows = [];
      const processed = new Set(); // To avoid duplicate arrows if structure is complex

      const processNode = (node, currentX = 0, currentY = 0) => {
        if (!node || !node.children) return;
        
        const nodeAbsX = currentX + (node.x || 0); // Absolute X of current node's logical center
        const nodeAbsY = currentY + (node.y || 0); // Absolute Y of current node's logical center
        
        node.children.forEach(child => {
          const childId = child.id;
          const arrowId = `${node.id}-${childId}`;
          
          if (processed.has(arrowId)) return;
          
          const parentEl = nodeRefs[node.id];
          const childEl = nodeRefs[childId];
          
          if (parentEl && childEl) {
            const parentRect = parentEl.getBoundingClientRect();
            const childRect = childEl.getBoundingClientRect();
            
            // Get visual center points, adjusted for the left panel offset
            const parentVisualCenterX = parentRect.left + parentRect.width / 2 - leftPanelWidth;
            const parentVisualCenterY = parentRect.top + parentRect.height / 2;
            const childVisualCenterX = childRect.left + childRect.width / 2 - leftPanelWidth;
            const childVisualCenterY = childRect.top + childRect.height / 2;
            
            const dx = childVisualCenterX - parentVisualCenterX;
            const dy = childVisualCenterY - parentVisualCenterY;
            const length = Math.sqrt(dx * dx + dy * dy);
            
            if (length > 0) {
              const startPoint = getEdgePoint(parentRect, childVisualCenterX, childVisualCenterY, leftPanelWidth);
              const endPoint = getEdgePoint(childRect, parentVisualCenterX, parentVisualCenterY, leftPanelWidth);
              
              newArrows.push({
                id: arrowId,
                from: startPoint,
                to: endPoint
              });
              processed.add(arrowId);
            }
          }
          
          // Recursively process children of the child node
          if (child && child.children) {
            processNode(child, nodeAbsX, nodeAbsY); // Pass parent's absolute logical position
          }
        });
      };
      
      // Start processing from root nodes
      nodes.forEach(node => processNode(node, 0, 0)); // Assuming root nodes have parentX=0, parentY=0
      setArrowData(newArrows);
    };
    
    const frameId = requestAnimationFrame(() => {
      calculateArrows();
    });
    
    return () => cancelAnimationFrame(frameId);
  }, [nodes, nodeRefs, leftPanelWidth]); // Rerun when nodes, their refs, or panel width change

  return arrowData;
};
