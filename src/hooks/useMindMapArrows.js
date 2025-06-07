import { useState, useEffect } from 'react';

// Function to find intersection point with a rectangle's edge
const getEdgePoint = (rect, targetX, targetY, panelWidthOffset = 0, fixedSide = null) => {
  // Calculate rectangle's visual center and boundaries in canvas coordinates
  const visualRectLeft = rect.left - panelWidthOffset;
  const visualRectRight = rect.right - panelWidthOffset;
  const visualRectTop = rect.top;
  const visualRectBottom = rect.bottom;

  const visualRectCenterX = visualRectLeft + rect.width / 2;
  const visualRectCenterY = visualRectTop + rect.height / 2;

  if (fixedSide) {
    switch (fixedSide) {
      case 'left':
        return { x: visualRectLeft, y: visualRectCenterY };
      case 'right':
        return { x: visualRectRight, y: visualRectCenterY };
      case 'top':
        return { x: visualRectCenterX, y: visualRectTop };
      case 'bottom':
        return { x: visualRectCenterX, y: visualRectBottom };
      default:
        // Fallthrough if fixedSide is invalid (should not happen with controlled inputs)
        break;
    }
  }

  // Dynamic calculation: targetX, targetY are already in canvas coordinates
  const dx = targetX - visualRectCenterX;
  const dy = targetY - visualRectCenterY;

  if (dx === 0 && dy === 0) return { x: visualRectCenterX, y: visualRectCenterY }; // Target is center

  let t = Infinity;

  // Check intersection with vertical edges (left and right of the visual rect)
  if (dx !== 0) {
    const tX1 = (visualRectLeft - visualRectCenterX) / dx;
    const tX2 = (visualRectRight - visualRectCenterX) / dx;

    const yAtTX1 = visualRectCenterY + tX1 * dy;
    const yAtTX2 = visualRectCenterY + tX2 * dy;

    if (tX1 >= 0 && tX1 <= 1 && yAtTX1 >= visualRectTop && yAtTX1 <= visualRectBottom) t = Math.min(t, tX1);
    if (tX2 >= 0 && tX2 <= 1 && yAtTX2 >= visualRectTop && yAtTX2 <= visualRectBottom) t = Math.min(t, tX2);
  }

  // Check intersection with horizontal edges (top and bottom of the visual rect)
  if (dy !== 0) {
    const tY1 = (visualRectTop - visualRectCenterY) / dy;
    const tY2 = (visualRectBottom - visualRectCenterY) / dy;

    const xAtTY1 = visualRectCenterX + tY1 * dx;
    const xAtTY2 = visualRectCenterX + tY2 * dx;

    if (tY1 >= 0 && tY1 <= 1 && xAtTY1 >= visualRectLeft && xAtTY1 <= visualRectRight) t = Math.min(t, tY1);
    if (tY2 >= 0 && tY2 <= 1 && xAtTY2 >= visualRectLeft && xAtTY2 <= visualRectRight) t = Math.min(t, tY2);
  }

  if (t === Infinity || t > 1) { // If no intersection found on segment [0,1] or t is beyond target
    if (Math.abs(dx) > Math.abs(dy)) {
        return { x: (dx > 0 ? visualRectRight : visualRectLeft), y: visualRectCenterY };
    } else {
        return { x: visualRectCenterX, y: (dy > 0 ? visualRectBottom : visualRectTop) };
    }
  }

  return {
    x: visualRectCenterX + t * dx,
    y: visualRectCenterY + t * dy
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

            const parentVisualCenterX = parentRect.left + parentRect.width / 2 - leftPanelWidth;
            const parentVisualCenterY = parentRect.top + parentRect.height / 2;
            const childVisualCenterX = childRect.left + childRect.width / 2 - leftPanelWidth;
            const childVisualCenterY = childRect.top + childRect.height / 2;

            // Determine fixed side for parent based on child's relative logical position
            const childRelX = child.x || 0;
            const childRelY = child.y || 0;
            let parentFixedSide = null;

            if (Math.abs(childRelX) > Math.abs(childRelY)) {
              parentFixedSide = childRelX > 0 ? 'right' : 'left';
            } else if (Math.abs(childRelY) > Math.abs(childRelX)) {
              parentFixedSide = childRelY > 0 ? 'bottom' : 'top';
            } else { // Equal magnitude or one/both are zero
              if (childRelX !== 0) parentFixedSide = childRelX > 0 ? 'right' : 'left';
              else if (childRelY !== 0) parentFixedSide = childRelY > 0 ? 'bottom' : 'top';
              else parentFixedSide = 'right'; // Default if child is at (0,0) relative to parent
            }

            // Determine fixed side for child (facing the parent)
            let childFixedSide = null;
            if (parentFixedSide === 'right') childFixedSide = 'left';
            else if (parentFixedSide === 'left') childFixedSide = 'right';
            else if (parentFixedSide === 'top') childFixedSide = 'bottom';
            else if (parentFixedSide === 'bottom') childFixedSide = 'top';
            
            const startPoint = getEdgePoint(parentRect, childVisualCenterX, childVisualCenterY, leftPanelWidth, parentFixedSide);
            const endPoint = getEdgePoint(childRect, parentVisualCenterX, parentVisualCenterY, leftPanelWidth, childFixedSide);
            
            const arrowDx = endPoint.x - startPoint.x;
            const arrowDy = endPoint.y - startPoint.y;
            const length = Math.sqrt(arrowDx * arrowDx + arrowDy * arrowDy);

            if (length > 0) {
              newArrows.push({
                id: arrowId,
                from: startPoint,
                to: endPoint
              });
              processed.add(arrowId);
            }
          }

          if (child.children && child.children.length > 0) {
            processNode(child, nodeAbsX, nodeAbsY);
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
