import React, { useState, useCallback, useRef, useEffect } from 'react';
import Node from '../Node/Node';
import Arrow from '../Arrow/Arrow';
import styles from './MindMapCanvas.module.css';

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
        <svg className={styles.arrowContainer}>
          {arrowData.map(arrow => (
            <Arrow key={arrow.id} {...arrow} />
          ))}
        </svg>
        <div className="node-layer">
          {renderNodeElements()}
        </div>
      </div>
      <a 
        href="https://github.com/guneykayim/mind_map" 
        target="_blank" 
        rel="noopener noreferrer"
        className={styles.githubLink}
        aria-label="View on GitHub"
      >
        <svg className={styles.githubIcon} viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
          <path fillRule="evenodd" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.22 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path>
        </svg>
        <span>View on GitHub</span>
      </a>
      <div className={styles.signature}>
        Vibe coded with ❤️ in Cambridge 🇬🇧
      </div>
    </div>
  );
};

export default MindMapCanvas;
