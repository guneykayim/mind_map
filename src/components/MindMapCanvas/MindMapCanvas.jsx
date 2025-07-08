import React, { useState, useCallback, useRef, useEffect } from 'react';
import Node from '../Node/Node';
import styles from './MindMapCanvas.module.css';
// import Arrow from '../Arrow/Arrow';
// Draw all arrows on a single canvas for full mind map coverage
function ArrowsCanvas({ arrowData, nodes }) {
  const canvasRef = useRef(null);
  // Compute bounding box
  const margin = 100;
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  nodes.forEach(node => {
    if (typeof node.x === 'number' && typeof node.y === 'number') {
      minX = Math.min(minX, node.x);
      minY = Math.min(minY, node.y);
      maxX = Math.max(maxX, node.x);
      maxY = Math.max(maxY, node.y);
    }
  });
  arrowData.forEach(({ from, to }) => {
    minX = Math.min(minX, from.x, to.x);
    minY = Math.min(minY, from.y, to.y);
    maxX = Math.max(maxX, from.x, to.x);
    maxY = Math.max(maxY, from.y, to.y);
  });
  if (!isFinite(minX) || !isFinite(minY) || !isFinite(maxX) || !isFinite(maxY)) {
    minX = minY = 0; maxX = maxY = 1000;
  }
  const width = Math.ceil(maxX - minX + 2 * margin);
  const height = Math.ceil(maxY - minY + 2 * margin);
  const offsetX = minX - margin;
  const offsetY = minY - margin;

  useEffect(() => {
    const ctx = canvasRef.current.getContext('2d');
    ctx.clearRect(0, 0, width, height);
    arrowData.forEach(({ from, to }) => {
      ctx.beginPath();
      ctx.moveTo(from.x - offsetX, from.y - offsetY);
      ctx.lineTo(to.x - offsetX, to.y - offsetY);
      ctx.strokeStyle = '#222';
      ctx.lineWidth = 2;
      ctx.stroke();
      // Arrowhead
      const angle = Math.atan2(to.y - from.y, to.x - from.x);
      const headlen = 10;
      ctx.beginPath();
      ctx.moveTo(to.x - offsetX, to.y - offsetY);
      ctx.lineTo(
        to.x - offsetX - headlen * Math.cos(angle - Math.PI / 6),
        to.y - offsetY - headlen * Math.sin(angle - Math.PI / 6)
      );
      ctx.lineTo(
        to.x - offsetX - headlen * Math.cos(angle + Math.PI / 6),
        to.y - offsetY - headlen * Math.sin(angle + Math.PI / 6)
      );
      ctx.lineTo(to.x - offsetX, to.y - offsetY);
      ctx.fillStyle = '#222';
      ctx.fill();
    });
  }, [arrowData, width, height, offsetX, offsetY]);
  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        pointerEvents: 'none',
        zIndex: 0,
        transform: `translate(${offsetX}px, ${offsetY}px)`
      }}
    />
  );
}
import BuyMeACoffeeButton from '../BuyMeACoffeeButton';
import ViewOnGitHubButton from '../ViewOnGitHubButton/ViewOnGitHubButton';

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
  onSetSelectedNodeIds, // New prop for setting multiple nodes
  onCanvasClick,
  onZoom, // New prop for handling zoom
  canvasContainerRef, // Ref for the container
  canvasContentRef,
  nodeRefs
}) => {
  const panState = useRef({ isPanning: false, didPan: false });
  const selectionState = useRef({ isSelecting: false });
  const [selectionRect, setSelectionRect] = useState(null);

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
      const delta = e.deltaY * -0.001;
      onZoom(zoomLevel + delta, focalPoint);
    } else {
      setPanOffset(prev => ({
        x: prev.x - e.deltaX,
        y: prev.y - e.deltaY,
      }));
    }
  }, [zoomLevel, onZoom, setPanOffset, canvasContainerRef]);

  useEffect(() => {
    const container = canvasContainerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
    }
    return () => {
      if (container) {
        container.removeEventListener('wheel', handleWheel);
      }
    };
  }, [canvasContainerRef, handleWheel]);

  const handleMouseDown = useCallback((e) => {
    const isBackgroundClick = e.target === e.currentTarget || e.target.classList.contains('mind-map-content-container');
    if (!isBackgroundClick) return;

    if (e.shiftKey) {
      // --- START PANNING ---
      panState.current = { isPanning: true, startX: e.clientX, startY: e.clientY, didPan: false };
      document.body.style.cursor = 'grabbing';
      document.body.classList.add('is-panning');

      const handlePanMove = (moveEvent) => {
        if (!panState.current.isPanning) return;
        panState.current.didPan = true;
        const dx = moveEvent.clientX - panState.current.startX;
        const dy = moveEvent.clientY - panState.current.startY;
        setPanOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
        panState.current.startX = moveEvent.clientX;
        panState.current.startY = moveEvent.clientY;
      };

      const handlePanUp = () => {
        panState.current.isPanning = false;
        document.body.style.cursor = 'default';
        document.body.classList.remove('is-panning');
        document.removeEventListener('mousemove', handlePanMove);
        document.removeEventListener('mouseup', handlePanUp);
      };

      document.addEventListener('mousemove', handlePanMove);
      document.addEventListener('mouseup', handlePanUp);

    } else {
      // --- START SELECTION LOGIC ---
      selectionState.current.isSelecting = true;
      const canvasContainerRect = e.currentTarget.getBoundingClientRect();
      const startX = e.clientX - canvasContainerRect.left;
      const startY = e.clientY - canvasContainerRect.top;
      
      const currentSelectionRect = { startX, startY, endX: startX, endY: startY };
      setSelectionRect(currentSelectionRect);

      const handleSelectionMove = (moveEvent) => {
        if (!selectionState.current.isSelecting) return;
        currentSelectionRect.endX = moveEvent.clientX - canvasContainerRect.left;
        currentSelectionRect.endY = moveEvent.clientY - canvasContainerRect.top;
        setSelectionRect({ ...currentSelectionRect });
      };

      const handleSelectionUp = () => {
        selectionState.current.isSelecting = false;
        document.removeEventListener('mousemove', handleSelectionMove);
        document.removeEventListener('mouseup', handleSelectionUp);

        setSelectionRect(null);

        const rect = {
          x: Math.min(currentSelectionRect.startX, currentSelectionRect.endX),
          y: Math.min(currentSelectionRect.startY, currentSelectionRect.endY),
          width: Math.abs(currentSelectionRect.startX - currentSelectionRect.endX),
          height: Math.abs(currentSelectionRect.startY - currentSelectionRect.endY),
        };

        // If the rectangle is tiny, treat it as a click to deselect all.
        if (rect.width < 5 && rect.height < 5) {
          onCanvasClick();
          return;
        }

        const selectedIds = [];
        const containerRect = canvasContainerRef.current.getBoundingClientRect();

        Object.keys(nodeRefs).forEach(nodeId => {
          const nodeEl = nodeRefs[nodeId];
          if (!nodeEl) return;

          const nodeRect = nodeEl.getBoundingClientRect();
          // Check for intersection between the selection rectangle and the node's bounding box
          if (
            rect.x < nodeRect.right - containerRect.left &&
            rect.x + rect.width > nodeRect.left - containerRect.left &&
            rect.y < nodeRect.bottom - containerRect.top &&
            rect.y + rect.height > nodeRect.top - containerRect.top
          ) {
            selectedIds.push(nodeId);
          }
        });

        onSetSelectedNodeIds(selectedIds);
      };

      document.addEventListener('mousemove', handleSelectionMove);
      document.addEventListener('mouseup', handleSelectionUp);
    }
  }, [
    setPanOffset,
    onSetSelectedNodeIds,
    onCanvasClick,
    nodeRefs,
    canvasContainerRef,
  ]);

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
            updateNodePosition={updateNodePosition}
            onAddNode={addNode}
            setNodeRef={el => setNodeRef(node.id, el)}
            onNodeIsDragging={onNodeIsDragging}
            isSelected={selectedNodeIds.includes(node.id)}
            onSelect={onNodeSelect}
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
      ref={canvasContainerRef}
      className="mind-map"
      onMouseDown={handleMouseDown}
    >
      {selectionRect && (
        <div 
          className="selection-rectangle" 
          style={{
            left: Math.min(selectionRect.startX, selectionRect.endX),
            top: Math.min(selectionRect.startY, selectionRect.endY),
            width: Math.abs(selectionRect.startX - selectionRect.endX),
            height: Math.abs(selectionRect.startY - selectionRect.endY),
          }}
        />
      )}
      <div ref={canvasContentRef} style={canvasStyle} className="mind-map-content-container">
        <ArrowsCanvas
          arrowData={arrowData}
          nodes={nodes}
        />
        <div className="node-layer">
          {renderNodeElements()}
        </div>
      </div>
      <div className={styles.topRightActions}>
        <ViewOnGitHubButton />
        <BuyMeACoffeeButton />
      </div>
      <div className={styles.signature}>
        Vibe coded with ❤️ in Cambridge 🇬🇧
      </div>
    </div>
  );
};

export default MindMapCanvas;
