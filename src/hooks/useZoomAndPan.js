import { useState, useCallback } from 'react';

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 2.0;

export const useZoomAndPan = (canvasContainerRef) => {
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

  return {
    zoomLevel,
    panOffset,
    setPanOffset,
    handleZoom,
    MIN_ZOOM,
    MAX_ZOOM
  };
};
