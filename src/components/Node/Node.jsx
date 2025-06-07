import React, { useState, useRef, useEffect, useCallback } from 'react';
import NodeText from '../NodeText';
import styles from './Node.module.css';

// Move these outside the component to prevent recreation
const noop = () => {};

function Node({ id, text, position = { x: 0, y: 0 }, onTextChange, onPositionChange, onAddNode, leftPanelWidth, setNodeRef, onNodeIsDragging = noop, isSelected = false, onSelect = noop }) {
  const [isEditing, setIsEditing] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [hoveredDirection, setHoveredDirection] = useState(null);
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
      onSelect();
    }
  }, [isEditing, onSelect]);

  const handleDoubleClick = useCallback(() => {
    setIsEditing(true);
  }, []);


  // Memoize the move handler to prevent recreation
  const handleMouseMove = useCallback((e) => {
    if (!dragState.current.isDragging) return;
    
    // Ensure hover state is false during drag
    setIsHovered(false);
    
    const { offsetX, offsetY } = dragState.current;
    const node = nodeRef.current;
    if (!node) return;
    
    const newX = e.clientX - offsetX - leftPanelWidth;
    const newY = e.clientY - offsetY;
    
    // Store last position for mouseup
    dragState.current.lastX = newX;
    dragState.current.lastY = newY;

    // No local position ref, just update transform
    requestAnimationFrame(() => {
      node.style.transform = `translate(${newX}px, ${newY}px)`;
    });
    onNodeIsDragging({ id, x: newX, y: newY });

  }, [leftPanelWidth, id, onNodeIsDragging]);

  // Memoize the end drag handler
  const handleMouseUp = useCallback(() => {
    onNodeIsDragging(null); // Clear dragging state first
    dragState.current.isDragging = false;
    document.body.style.cursor = 'default';
    
    // Restore hover state if mouse is still over the node
    const node = nodeRef.current;
    if (node && node.matches(':hover') && !isEditing) {
      setIsHovered(true);
    }

    // Call onPositionChange with the final position
    if (typeof onPositionChange === 'function' && typeof dragState.current.lastX === 'number') {
      onPositionChange(dragState.current.lastX, dragState.current.lastY);
    }
  }, [isEditing, onNodeIsDragging]);

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
  }, [isEditing, handleMouseMove, handleMouseUp, leftPanelWidth]);

  // Clean up event listeners
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

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
    if (node && (!position || (position.x === 0 && position.y === 0))) {
      // Center the node in the mind map container
      const mindMap = node.closest('.mind-map');
      if (!mindMap) return;
      
      // Get the mind map's dimensions and padding
      const mindMapRect = mindMap.getBoundingClientRect();
      const mindMapStyle = window.getComputedStyle(mindMap);
      const paddingLeft = parseFloat(mindMapStyle.paddingLeft) || 0;
      const paddingTop = parseFloat(mindMapStyle.paddingTop) || 0;
      
      // Calculate available space for centering
      const availableWidth = mindMapRect.width - (paddingLeft * 2);
      const availableHeight = mindMapRect.height - (paddingTop * 2);
      
      // Calculate center position
      const centerX = (availableWidth / 2) - (node.offsetWidth / 2) + paddingLeft;
      const centerY = (availableHeight / 2) - (node.offsetHeight / 2) + paddingTop;
      
      if (typeof onPositionChange === 'function') {
        onPositionChange(centerX, centerY);
      }
      node.style.transform = `translate(${centerX}px, ${centerY}px)`;
    }
  }, [leftPanelWidth]);

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
        parentWidth: rect.width,
        parentHeight: rect.height,
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
      style={{ transform: `translate(${position.x}px, ${position.y}px)` }}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
      onMouseEnter={() => !isEditing && !dragState.current.isDragging && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <NodeText 
        text={text} 
        isEditing={isEditing} 
        setIsEditing={setIsEditing}
        onTextChange={onTextChange || noop}
        onBlur={handleTextChange}
      />
      {isHovered && showAddButtons && (
        <>
          <button 
            className={
              styles.addNodeButton +
              ' ' + styles.top +
              (hoveredDirection === 'top' ? ' ' + styles.hovered : '')
            }
            onMouseEnter={() => setHoveredDirection('top')}
            onMouseLeave={() => setHoveredDirection(null)}
            onClick={(event) => { event.stopPropagation(); handleAddNodeClick('top'); }}
            title="Add node above"
          >+</button>
          <button 
            className={`${styles.addNodeButton} ${styles.right} ${hoveredDirection === 'right' ? styles.hovered : ''}`}
            onClick={(event) => { event.stopPropagation(); handleAddNodeClick('right'); }}
            title="Add node to the right"
            onMouseEnter={() => setHoveredDirection('right')}
            onMouseLeave={() => setHoveredDirection(null)}
          >+</button>
          <button 
            className={`${styles.addNodeButton} ${styles.bottom} ${hoveredDirection === 'bottom' ? styles.hovered : ''}`}
            onClick={(event) => { event.stopPropagation(); handleAddNodeClick('bottom'); }}
            title="Add node below"
            onMouseEnter={() => setHoveredDirection('bottom')}
            onMouseLeave={() => setHoveredDirection(null)}
          >+</button>
          <button 
            className={`${styles.addNodeButton} ${styles.left} ${hoveredDirection === 'left' ? styles.hovered : ''}`}
            onClick={(event) => { event.stopPropagation(); handleAddNodeClick('left'); }}
            title="Add node to the left"
            onMouseEnter={() => setHoveredDirection('left')}
            onMouseLeave={() => setHoveredDirection(null)}
          >+</button>
        </>
      )}
    </div>
  );
}

export default React.memo(Node); // Memoize for performance
