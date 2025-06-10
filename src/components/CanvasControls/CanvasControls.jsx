import React from 'react';
import styles from './CanvasControls.module.css';

const CanvasControls = ({ zoomLevel, setZoomLevel, minZoom, maxZoom, setPanOffset }) => {
  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.1, maxZoom));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.1, minZoom));
  };

  const handleResetZoom = () => {
    setZoomLevel(1);
  };

  const handleSliderChange = (e) => {
    setZoomLevel(parseFloat(e.target.value));
  };

  const handleResetPan = () => {
    setPanOffset({ x: 0, y: 0 });
  };

  return (
    <div className={styles['zoom-controls']}>
      <button onClick={handleResetPan} title="Reset View">📍</button>
      <button onClick={handleZoomOut}>-</button>
      <input
        type="range"
        min={minZoom}
        max={maxZoom}
        step="0.01"
        value={zoomLevel}
        onChange={handleSliderChange}
        className={styles['zoom-slider']}
      />
      <button onClick={handleZoomIn}>+</button>
      <button onClick={handleResetZoom} className={styles['reset-zoom-button']} title="Reset Zoom">🔄</button>
      <span className={styles['zoom-display']}>{Math.round(zoomLevel * 100)}%</span>
    </div>
  );
};

export default CanvasControls;
