import React, { useState, useRef, useEffect, useCallback } from 'react';
import NodeText from '../NodeText';
import styles from './Node.module.css';

// Move these outside the component to prevent recreation
const noop = () => {};

function Node({ text, onTextChange, leftPanelWidth }) {
  const [isEditing, setIsEditing] = useState(false);
  const nodeRef = useRef(null);
  const dragState = useRef({
    isDragging: false,
    offsetX: 0,
    offsetY: 0,
    node: null
  });

  const handleDoubleClick = useCallback(() => {
    setIsEditing(true);
  }, []);

  // Track the current position
  const position = useRef({ x: 0, y: 0 });

  // Memoize the move handler to prevent recreation
  const handleMouseMove = useCallback((e) => {
    if (!dragState.current.isDragging) return;
    
    const { offsetX, offsetY } = dragState.current;
    const node = nodeRef.current;
    if (!node) return;
    
    const newX = e.clientX - offsetX - leftPanelWidth;
    const newY = e.clientY - offsetY;
    
    position.current = { x: newX, y: newY };
    
    // Use requestAnimationFrame for smoother animation
    requestAnimationFrame(() => {
      node.style.transform = `translate(${newX}px, ${newY}px)`;
    });
  }, [leftPanelWidth]);

  // Memoize the end drag handler
  const handleMouseUp = useCallback(() => {
    dragState.current.isDragging = false;
    document.body.style.cursor = 'default';
  }, []);

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
    
    // Initialize position if not set
    if (position.current.x === 0 && position.current.y === 0) {
      position.current = {
        x: rect.left - leftPanelWidth,
        y: rect.top
      };
      node.style.transform = `translate(${position.current.x}px, ${position.current.y}px)`;
    }

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

  // Initialize node position on mount
  useEffect(() => {
    const node = nodeRef.current;
    if (node && !position.current.x && !position.current.y) {
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
      
      position.current = { x: centerX, y: centerY };
      node.style.transform = `translate(${centerX}px, ${centerY}px)`;
    }
  }, [leftPanelWidth]);

  return (
    <div 
      ref={nodeRef}
      className={`${styles.node} ${isEditing ? styles.isEditing : ''}`}
      onDoubleClick={handleDoubleClick}
      onMouseDown={handleMouseDown}
      style={{
        willChange: 'transform',
        left: 0,
        top: 0
      }}
    >
      <NodeText 
        text={text} 
        onTextChange={onTextChange}
        isEditing={isEditing}
        setIsEditing={setIsEditing}
      />
    </div>
  );
}

export default Node;
