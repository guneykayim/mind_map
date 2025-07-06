import React from 'react';
import { MdUndo, MdRedo, MdMyLocation, MdZoomOut, MdZoomIn, MdRefresh } from 'react-icons/md';
import styles from './CanvasControls.module.css';

const CanvasControls = ({
  zoomLevel,
  onZoom,
  minZoom,
  maxZoom,
  onResetPan,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
}) => {
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
    onResetPan();
  };

  return (
    <div className={styles['zoom-controls']}>
      <button onClick={onUndo} title="Undo" disabled={!canUndo}><MdUndo size={22} /></button>
      <button onClick={onRedo} title="Redo" disabled={!canRedo}><MdRedo size={22} /></button>
      <button onClick={handleResetPan} title="Reset View"><MdMyLocation size={22} /></button>
      <button onClick={handleZoomOut} title="Zoom Out"><MdZoomOut size={22} /></button>
      <input
        type="range"
        min={minZoom}
        max={maxZoom}
        step="0.01"
        value={zoomLevel}
        onChange={handleSliderChange}
        className={styles['zoom-slider']}
      />
      <button onClick={handleZoomIn} title="Zoom In"><MdZoomIn size={22} /></button>
      <button onClick={handleResetZoom} className={styles['reset-zoom-button']} title="Reset Zoom"><MdRefresh size={24} /></button>
      <span className={styles['zoom-display']}>{Math.round(zoomLevel * 100)}%</span>
    </div>
  );
};

export default CanvasControls;
