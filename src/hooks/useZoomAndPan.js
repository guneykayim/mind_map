import { useState, useCallback } from 'react';

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 2.0;

export const useZoomAndPan = (canvasContainerRef, nodes, nodeRefs) => {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });

  const handleZoom = useCallback((newZoom, focalPoint) => {
    const clampedZoom = Math.max(MIN_ZOOM, Math.min(newZoom, MAX_ZOOM));
    const container = canvasContainerRef.current;
    if (!container) return;

    const { width, height } = container.getBoundingClientRect();
    const fp = focalPoint || { x: width / 2, y: height / 2 };

    const contentX = (fp.x - panOffset.x) / zoomLevel;
    const contentY = (fp.y - panOffset.y) / zoomLevel;

    const newPanX = fp.x - contentX * clampedZoom;
    const newPanY = fp.y - contentY * clampedZoom;

    setZoomLevel(clampedZoom);
    setPanOffset({ x: newPanX, y: newPanY });
  }, [zoomLevel, panOffset, canvasContainerRef]);

  const resetView = useCallback(() => {
    const container = canvasContainerRef.current;
    if (!container) return;

    const rootNodeData = nodes.find(n => n.id === 'root');
    const rootNodeEl = nodeRefs.current?.root;
    if (!rootNodeData || !rootNodeEl) return;

    const nodeToCenter = {
      ...rootNodeData,
      width: rootNodeEl.offsetWidth,
      height: rootNodeEl.offsetHeight
    };

    const { width: containerWidth, height: containerHeight } = container.getBoundingClientRect();
    const nodeX = nodeToCenter.x;
    const nodeY = nodeToCenter.y;
    const nodeWidth = nodeToCenter.width;
    const nodeHeight = nodeToCenter.height;

    const contentCenterX = nodeX + nodeWidth / 2;
    const contentCenterY = nodeY + nodeHeight / 2;

    const newPanX = (containerWidth / 2) - contentCenterX * zoomLevel;
    const newPanY = (containerHeight / 2) - contentCenterY * zoomLevel;

    setPanOffset({ x: newPanX, y: newPanY });
  }, [canvasContainerRef, zoomLevel, nodes, nodeRefs]);

  return {
    zoomLevel,
    panOffset,
    setPanOffset,
    handleZoom,
    resetView,
    MIN_ZOOM,
    MAX_ZOOM
  };
};
