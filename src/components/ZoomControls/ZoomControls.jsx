import React from 'react';
import styles from './ZoomControls.module.css';

const ZoomControls = ({ zoomLevel, setZoomLevel, minZoom, maxZoom }) => {
  const handleZoomIn = () => {
    setZoomLevel(prevZoom => Math.min(maxZoom, prevZoom + 0.1));
  };

  const handleZoomOut = () => {
    setZoomLevel(prevZoom => Math.max(minZoom, prevZoom - 0.1));
  };

  const handleSliderChange = (event) => {
    setZoomLevel(parseFloat(event.target.value));
  };

  const handleResetZoom = () => {
    setZoomLevel(1);
  };

  return (
    <div className={styles['zoom-controls']}>
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

export default ZoomControls;
