import React, { useRef, useCallback } from 'react';
import Node from '../Node/Node';
import Arrow from '../Arrow/Arrow';
// import styles from './MindMapCanvas.module.css'; // Uncomment if you use specific styles

const MindMapCanvas = ({
  zoomLevel,
  panOffset,
  setPanOffset,
  nodes,
  arrowData,
  handleTextChange,
  updateNodePosition,
  addNode,
  setNodeRef,
  onNodeIsDragging,
  selectedNodeIds,
  onNodeSelect,
  onCanvasClick,
  onZoom, // New prop for handling zoom
  canvasContainerRef, // Ref for the container
  canvasContentRef
}) => {
  const panState = useRef({ isPanning: false, didPan: false });

  const canvasStyle = {
    transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
    transformOrigin: 'top left',
    width: '100%',
    height: '100%',
  };

  const handleWheel = useCallback((e) => {
    e.preventDefault();
    if (e.ctrlKey) {
      const container = canvasContainerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const focalPoint = { 
        x: e.clientX - rect.left,
        y: e.clientY - rect.top 
      };
      const delta = e.deltaY * -0.005;
      onZoom(zoomLevel + delta, focalPoint);
    } else {
      setPanOffset(prev => ({
        x: prev.x - e.deltaX,
        y: prev.y - e.deltaY,
      }));
    }
  }, [zoomLevel, onZoom, setPanOffset, canvasContainerRef]);

  const handlePanMouseDown = useCallback((e) => {
    // Only pan if shift is pressed and clicking on the canvas background
    if (e.shiftKey && (e.target.classList.contains('mind-map-content-container') || e.target.classList.contains('mind-map'))) {
      panState.current = { isPanning: true, didPan: false };
      document.body.style.cursor = 'grabbing';
      document.body.classList.add('is-panning');

      const handleMouseMove = (moveEvent) => {
        if (panState.current.isPanning) {
          panState.current.didPan = true;
          setPanOffset(prev => ({
            x: prev.x + moveEvent.movementX,
            y: prev.y + moveEvent.movementY,
          }));
        }
      };

      const handleMouseUp = () => {
        panState.current.isPanning = false;
        document.body.style.cursor = 'default';
        document.body.classList.remove('is-panning');
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp, { once: true });
    }
  }, [setPanOffset]);

  const handleCanvasClick = (e) => {
    const didPan = panState.current.didPan;
    panState.current.didPan = false; // Reset for the next click

    if (didPan || e.shiftKey) {
      return; // Don't deselect if we just finished a pan or if shift is pressed
    }
    onCanvasClick();
  };

  // Recursive rendering of nodes
  const renderNodeElements = (nodeList = nodes) => {
    return nodeList.map(node => {
      if (!node || typeof node.id === 'undefined') {
        console.error('Invalid node encountered in renderNodeElements:', node);
        return null;
      }

      return (
        <React.Fragment key={node.id}>
          <Node
            id={node.id}
            text={node.text || ''}
            position={{ x: node.x || 0, y: node.y || 0 }}
            side={node.side}
            onTextChange={newText => handleTextChange(node.id, newText)}
            onPositionChange={(absoluteX, absoluteY) => updateNodePosition(node.id, absoluteX, absoluteY)}
            onAddNode={addNode}
            setNodeRef={el => setNodeRef(node.id, el)}
            onNodeIsDragging={onNodeIsDragging}
            isSelected={selectedNodeIds.includes(node.id)}
            onSelect={(e) => onNodeSelect(node.id, e.shiftKey)}
            zoomLevel={zoomLevel}
            canvasContentRef={canvasContentRef}
          />
          {node.children && node.children.length > 0 && renderNodeElements(node.children)}
        </React.Fragment>
      );
    });
  };

  return (
    <div
      ref={canvasContainerRef} // Attach ref to the container
      className="mind-map"
      onClick={handleCanvasClick}
      onWheel={handleWheel}
      onMouseDown={handlePanMouseDown}
    >
      <div ref={canvasContentRef} style={canvasStyle} className="mind-map-content-container">
        {arrowData.map(arrow => (
          <Arrow key={arrow.id} from={arrow.from} to={arrow.to} />
        ))}
        <div className="node-layer">
          {renderNodeElements()}
        </div>
      </div>
    </div>
  );
};

export default MindMapCanvas;
