import { useState, useEffect } from 'react';

// Function to find intersection point with a rectangle's edge
// Function to find intersection point with a rectangle's edge (returns viewport coordinates)
const getEdgePoint = (rect, targetX, targetY, fixedSide = null) => {
  // Calculate rectangle's visual center and boundaries in canvas coordinates
  const visualRectLeft = rect.left;
  const visualRectRight = rect.right;
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

export const useMindMapArrows = (nodes, nodeRefs, draggingNodeInfo, zoomLevel = 1, canvasContentRef) => {
  const [arrowData, setArrowData] = useState([]);

  useEffect(() => {
    const calculateArrows = () => {
      if (!nodes || !nodeRefs) return;
      const newArrows = [];
      const processed = new Set(); // To avoid duplicate arrows if structure is complex

      const processNodeRecursive = (parentNode) => { // parentNode.x and parentNode.y are absolute
        if (!parentNode || !parentNode.children || parentNode.children.length === 0) return;

        const parentAbsoluteX = parentNode.x || 0;
        const parentAbsoluteY = parentNode.y || 0;

        parentNode.children.forEach(childNode => {
          const childAbsoluteX = childNode.x || 0;
          const childAbsoluteY = childNode.y || 0;
          const arrowId = `${parentNode.id}-${childNode.id}`;

          if (processed.has(arrowId)) return;

          const parentEl = nodeRefs[parentNode.id];
          const childEl = nodeRefs[childNode.id];

          if (parentEl && childEl) {
            const parentRect = parentEl.getBoundingClientRect();
            const childRect = childEl.getBoundingClientRect();

            let actualParentVisualCenterX = parentRect.left + parentRect.width / 2;
            let actualParentVisualCenterY = parentRect.top + parentRect.height / 2;
            let actualChildVisualCenterX = childRect.left + childRect.width / 2;
            let actualChildVisualCenterY = childRect.top + childRect.height / 2;

            if (draggingNodeInfo && canvasContentRef.current) {
              const containerRect = canvasContentRef.current.getBoundingClientRect();
              const containerOriginViewportX = containerRect.left;
              const containerOriginViewportY = containerRect.top;

              if (draggingNodeInfo.id === parentNode.id) { // Parent node is being dragged
                const unscaledWidth = parentRect.width / zoomLevel;
                const unscaledHeight = parentRect.height / zoomLevel;
                // draggingNodeInfo.x and .y are already absolute logical coordinates
                const localUnscaledCenterX = draggingNodeInfo.x + unscaledWidth / 2;
                const localUnscaledCenterY = draggingNodeInfo.y + unscaledHeight / 2;
                actualParentVisualCenterX = (localUnscaledCenterX * zoomLevel) + containerOriginViewportX;
                actualParentVisualCenterY = (localUnscaledCenterY * zoomLevel) + containerOriginViewportY;
              }
              if (draggingNodeInfo.id === childNode.id) { // Child node is being dragged
                const unscaledWidth = childRect.width / zoomLevel;
                const unscaledHeight = childRect.height / zoomLevel;
                // draggingNodeInfo.x and .y are already absolute logical coordinates
                const localUnscaledCenterX = draggingNodeInfo.x + unscaledWidth / 2;
                const localUnscaledCenterY = draggingNodeInfo.y + unscaledHeight / 2;
                actualChildVisualCenterX = (localUnscaledCenterX * zoomLevel) + containerOriginViewportX;
                actualChildVisualCenterY = (localUnscaledCenterY * zoomLevel) + containerOriginViewportY;
              }
            }

            // Determine fixed side for parent based on child's position RELATIVE to parent
            const childRelX = childAbsoluteX - parentAbsoluteX;
            const childRelY = childAbsoluteY - parentAbsoluteY;
            let parentFixedSide = null;

            parentFixedSide = childRelX > 0 ? 'right' : 'left';

            // Determine fixed side for child (facing the parent)
            let childFixedSide = null;
            if (parentFixedSide === 'right') childFixedSide = 'left';
            else if (parentFixedSide === 'left') childFixedSide = 'right';
            
            const vpStartPoint = getEdgePoint(parentRect, actualChildVisualCenterX, actualChildVisualCenterY, parentFixedSide);
            const vpEndPoint = getEdgePoint(childRect, actualParentVisualCenterX, actualParentVisualCenterY, childFixedSide);

            let containerOriginViewportX = 0;
            let containerOriginViewportY = 0;
            if (canvasContentRef.current) {
              const containerRect = canvasContentRef.current.getBoundingClientRect();
              containerOriginViewportX = containerRect.left;
              containerOriginViewportY = containerRect.top;
            } else {
              console.warn('canvasContentRef.current is not available in useMindMapArrows');
            }

            const localStartPoint = {
              x: (vpStartPoint.x - containerOriginViewportX) / zoomLevel,
              y: (vpStartPoint.y - containerOriginViewportY) / zoomLevel,
            };
            const localEndPoint = {
              x: (vpEndPoint.x - containerOriginViewportX) / zoomLevel,
              y: (vpEndPoint.y - containerOriginViewportY) / zoomLevel,
            };
            
            const arrowDx = localEndPoint.x - localStartPoint.x;
            const arrowDy = localEndPoint.y - localStartPoint.y;
            const length = Math.sqrt(arrowDx * arrowDx + arrowDy * arrowDy);

            if (length > 0) { // Ensure there's a visible arrow to draw
              newArrows.push({
                id: arrowId,
                from: localStartPoint,
                to: localEndPoint
              });
              processed.add(arrowId);
            }
          }

          // Recursively process children of the current childNode
          if (childNode.children && childNode.children.length > 0) {
            processNodeRecursive(childNode);
          }
        });
      };
      
      // Start processing from root nodes
      nodes.forEach(rootNode => processNodeRecursive(rootNode));
      setArrowData(newArrows);
    };
    
    const frameId = requestAnimationFrame(() => {
      calculateArrows();
    });
    
    return () => cancelAnimationFrame(frameId);
  }, [nodes, nodeRefs, draggingNodeInfo, zoomLevel, canvasContentRef]);

  return arrowData;
};
