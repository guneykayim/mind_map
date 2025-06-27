import React, { useState, useRef, useEffect, useCallback } from 'react';
import NodeText from '../NodeText';
import styles from './Node.module.css';

// Move these outside the component to prevent recreation
const noop = () => {};

function Node({ id, text, position = { x: 0, y: 0 }, onTextChange, updateNodePosition, onAddNode, /*leftPanelWidth,*/ setNodeRef, onNodeIsDragging = noop, isSelected = false, onSelect = noop, zoomLevel = 1, canvasContentRef, side }) {
  const [isEditing, setIsEditing] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [editingWidth, setEditingWidth] = useState(null);

  const nodeRef = useRef(null);
  const dragState = useRef({
    isDragging: false,
    offsetX: 0,
    offsetY: 0,
    node: null,
    lastX: 0, // Store last calculated X
    lastY: 0  // Store last calculated Y
  });

  const handleClick = useCallback((event) => {
    event.stopPropagation(); // Stop propagation
    if (!dragState.current.isDragging && !isEditing) {
      onSelect(event, id);
    }
  }, [isEditing, onSelect, id]);

  const handleStartEditing = useCallback(() => {
    if (nodeRef.current) {
      setEditingWidth(nodeRef.current.offsetWidth);
    }
    setIsEditing(true);
  }, []);


  // Memoize the move handler to prevent recreation
  const handleMouseMove = useCallback((e) => {
    if (!dragState.current.isDragging) return;
    
    // Ensure hover state is false during drag
    setIsHovered(false);
    
    if (!dragState.current.isDragging || !canvasContentRef.current) return;

    const { offsetX, offsetY } = dragState.current;
    const node = nodeRef.current;
    if (!node) return;

    const containerRect = canvasContentRef.current.getBoundingClientRect();

    // Calculate node's new top-left in viewport coordinates
    const viewportNodeX = e.clientX - offsetX;
    const viewportNodeY = e.clientY - offsetY;

    // Calculate node's new top-left relative to the scaled container (these are scaled screen pixels)
    const relativeX_scaled = viewportNodeX - containerRect.left;
    const relativeY_scaled = viewportNodeY - containerRect.top;

    // Calculate unscaled ABSOLUTE logical coordinates relative to the container
    const absoluteLogicalX = relativeX_scaled / zoomLevel;
    const absoluteLogicalY = relativeY_scaled / zoomLevel;

    // Update visual position directly using ABSOLUTE logical (unscaled) left/top coordinates,
    // because the Node's div is positioned absolutely within the 'mind-map-content-container'.
    requestAnimationFrame(() => {
      node.style.left = `${absoluteLogicalX}px`;
      node.style.top = `${absoluteLogicalY}px`;
      node.style.transform = ''; // Clear transform to avoid interference
    });

    // For state updates (onNodeIsDragging, onPositionChange), use ABSOLUTE logical coordinates.
    dragState.current.lastX = absoluteLogicalX;
    dragState.current.lastY = absoluteLogicalY;

    onNodeIsDragging({ id, x: absoluteLogicalX, y: absoluteLogicalY });

  }, [id, onNodeIsDragging, zoomLevel, canvasContentRef]);

  // Memoize the end drag handler
  const handleMouseUp = useCallback(() => {
    onNodeIsDragging(null); // Clear dragging state first
    dragState.current.isDragging = false;
    document.body.style.cursor = 'default';
    
    // Restore hover state if mouse is still over the node
    const node = nodeRef.current;
    if (node) {
      // Reset direct style manipulations to allow React to control positioning via props
      node.style.left = ''; 
      node.style.top = '';
      // node.style.transform = ''; // Already cleared during move, but good to be explicit if needed

      if (node.matches(':hover') && !isEditing) {
        setIsHovered(true);
      }
    }

    // Call onPositionChange with the final ABSOLUTE canvas position
    if (typeof updateNodePosition === 'function' && typeof dragState.current.lastX === 'number') {
      updateNodePosition(id, dragState.current.lastX, dragState.current.lastY);
    }
  }, [isEditing, onNodeIsDragging, id, updateNodePosition]);

  const handleMouseDown = useCallback((e) => {
    if (isEditing) return;
    
    const node = nodeRef.current;
    if (!node) return;

    // Get initial position and calculate offset
    const rect = node.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;
    
    dragState.current = {
      isDragging: true,
      offsetX,
      offsetY,
      node
    };
    
    // Set cursor and add event listeners
    document.body.style.cursor = 'grabbing';
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp, { once: true });
  }, [isEditing, handleMouseMove, handleMouseUp]);

  // Clean up event listeners
  // Clean up event listeners: Attach and detach on mount/unmount or when handlers change
  useEffect(() => {
    const currentMouseMove = handleMouseMove;
    const currentMouseUp = handleMouseUp;
    // Add listeners in handleMouseDown, remove them in handleMouseUp and on unmount
    // This effect is primarily for cleanup on unmount if listeners were somehow left active.
    return () => {
      document.removeEventListener('mousemove', currentMouseMove);
      document.removeEventListener('mouseup', currentMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]); // Keep dependencies for ESLint, though listeners are managed in mousedown/mouseup


  // Handle cursor changes based on edit state
  useEffect(() => {
    document.body.style.cursor = isEditing ? 'text' : 'move';
    return () => {
      document.body.style.cursor = 'default';
    };
  }, [isEditing]);

  // Computed value to determine if add buttons should be shown
  const showAddButtons = !isEditing && !dragState.current.isDragging;

  // Initialize node position on mount
  useEffect(() => {
    if (setNodeRef) setNodeRef(nodeRef.current);
    const node = nodeRef.current;
    // Initial centering logic might need review if `position` is now always relative to mind-map-content-container
    // For now, keeping it as is, but this part might be simplified or adjusted
    // if initial position (0,0) should mean top-left of the content container.
    if (node && canvasContentRef && canvasContentRef.current && (!position || (position.x === 0 && position.y === 0 && id === 'root'))) { // Only center root initially
      const contentContainer = canvasContentRef.current;
      const containerRect = contentContainer.getBoundingClientRect(); // This is the scaled rect
      
      // We want to center it within the viewport of the content container, in unscaled coordinates
      const unscaledContainerWidth = containerRect.width / zoomLevel;
      const unscaledContainerHeight = containerRect.height / zoomLevel;
      
      const nodeWidth = node.offsetWidth; // This is unscaled
      const nodeHeight = node.offsetHeight; // This is unscaled

      const logicalCenterX = (unscaledContainerWidth / 2) - (nodeWidth / 2);
      const logicalCenterY = (unscaledContainerHeight / 2) - (nodeHeight / 2);
      
      if (typeof updateNodePosition === 'function') {
        updateNodePosition(id, logicalCenterX, logicalCenterY, true);
      }
    }
  }, [id, updateNodePosition, setNodeRef, zoomLevel, canvasContentRef]); // Removed leftPanelWidth, added zoomLevel, canvasContentRef

  const handleAddNodeClick = (direction) => {
    if (onAddNode && id && nodeRef.current) {
      const rect = nodeRef.current.getBoundingClientRect();
      const mindMap = nodeRef.current.closest('.mind-map');
      let latestX = 0, latestY = 0;
      if (mindMap) {
        const mindMapRect = mindMap.getBoundingClientRect();
        latestX = rect.left - mindMapRect.left;
        latestY = rect.top - mindMapRect.top;
      }
      onAddNode(id, direction, {
        parentWidth: rect.width / zoomLevel,
        parentHeight: rect.height / zoomLevel,
        latestX,
        latestY
      });
    }
  };

  // Add missing hover handlers
  const handleMouseEnter = () => {
    if (!isEditing) setIsHovered(true);
  };
  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  const handleTextChange = (newText) => {
    setEditingWidth(null);
    setIsEditing(false);
    if (onTextChange) {
      onTextChange(newText);
    }
  };

  return (
    <div
      ref={el => {
        nodeRef.current = el;
        if (setNodeRef) setNodeRef(el);
      }}
      className={`${styles.node} ${isEditing ? styles.isEditing : ''} ${isSelected ? styles.selected : ''}`}
      style={{
        transform: `translate(${position.x}px, ${position.y}px)`,
        width: isEditing && editingWidth ? `${editingWidth}px` : undefined,
      }}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      onMouseEnter={() => !isEditing && !dragState.current.isDragging && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <NodeText 
        text={text} 
        isEditing={isEditing} 
        setIsEditing={setIsEditing}
        onTextChange={onTextChange || noop}
        onBlur={handleTextChange}
        onStartEditing={handleStartEditing}
      />
      {isHovered && showAddButtons && (
        <>
          {(id === 'root' || side === 'right') && (
            <button 
              className={`${styles.addNodeButton} ${styles.right}`}
              onClick={(event) => { event.stopPropagation(); handleAddNodeClick('right'); }}
              title="Add node to the right"
            >+</button>
          )}

          {(id === 'root' || side === 'left') && (
            <button 
              className={`${styles.addNodeButton} ${styles.left}`}
              onClick={(event) => { event.stopPropagation(); handleAddNodeClick('left'); }}
              title="Add node to the left"
            >+</button>
          )}
        </>
      )}
    </div>
  );
}

export default React.memo(Node); // Memoize for performance
