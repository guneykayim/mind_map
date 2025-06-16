import React from 'react';
import styles from './CanvasControls.module.css';

const CanvasControls = ({ zoomLevel, onZoom, minZoom, maxZoom, setPanOffset }) => {
  const handleZoomIn = () => {
    onZoom(zoomLevel + 0.1);
  };

  const handleZoomOut = () => {
    onZoom(zoomLevel - 0.1);
  };

  const handleResetZoom = () => {
    onZoom(1);
  };

  const handleSliderChange = (e) => {
    onZoom(parseFloat(e.target.value));
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
