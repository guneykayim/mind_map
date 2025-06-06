import { useState, useCallback } from 'react';

// Generate a simple unique ID
const generateId = () => Math.random().toString(36).substr(2, 9);

// Initial node structure
const initialNodes = [
  {
    id: 'root',
    text: 'Root Node',
    x: 0,
    y: 0,
    children: []
  }
];

export const useMindMapNodes = () => {
  const [nodes, setNodes] = useState(initialNodes);

  const findNodeById = useCallback((nodeList, nodeId) => {
    for (const node of nodeList) {
      if (node.id === nodeId) return node;
      if (node.children) {
        const found = findNodeById(node.children, nodeId);
        if (found) return found;
      }
    }
    return null;
  }, []);

  const findNodeAndAbsPos = useCallback((targetNodeId, currentNodesParam, parentAbs = {x:0, y:0}) => {
    const currentNodes = currentNodesParam === undefined ? nodes : currentNodesParam;
    for (const node of currentNodes) {
      const absX = parentAbs.x + (node.x || 0);
      const absY = parentAbs.y + (node.y || 0);
      if (node.id === targetNodeId) {
        return { node, absX, absY };
      }
      if (node.children && node.children.length > 0) {
        const found = findNodeAndAbsPos(targetNodeId, node.children, {x: absX, y: absY});
        if (found) return found;
      }
    }
    return null;
  }, [nodes]);

  const addNode = useCallback((parentId, direction, dims = {}) => {
    const newId = generateId();
    const defaultChildWidth = 120;
    const defaultChildHeight = 60;
    const parentWidth = dims.parentWidth || defaultChildWidth;
    const parentHeight = dims.parentHeight || defaultChildHeight;
    let x = 0, y = 0;

    switch (direction) {
      case 'right':
        x = parentWidth + 80;
        y = 0;
        break;
      case 'left':
        x = -(parentWidth + 80);
        y = 0;
        break;
      case 'top':
        x = 0;
        y = -(parentHeight + 80);
        break;
      case 'bottom':
        x = 0;
        y = parentHeight + 80;
        break;
      default:
        x = parentWidth + 80;
        y = 0;
    }

    setNodes(prevNodes => {
      const updateNodeTree = (currentNodesToUpdate) => currentNodesToUpdate.map(node => {
        if (node.id === parentId) {
          const newNode = {
            id: newId,
            text: 'New Node',
            x: x, 
            y: y, 
            children: []
          };
          return {
            ...node,
            children: [...(node.children || []), newNode]
          };
        }
        if (node.children && node.children.length > 0) {
          return {
            ...node,
            children: updateNodeTree(node.children)
          };
        }
        return node;
      });
      return updateNodeTree(prevNodes);
    });
  }, [setNodes]);

  const updateNodePosition = useCallback((nodeId, newRelativeX, newRelativeY) => {
    setNodes(prevNodes => {
      const draggedNodePreviousState = findNodeById(prevNodes, nodeId);

      if (!draggedNodePreviousState) {
        console.warn(`Node with id ${nodeId} not found in prevNodes for position update. Performing simple update.`);
        const fallbackRecursive = (currentNodesToUpdate) => currentNodesToUpdate.map(node => {
          if (node.id === nodeId) {
            return { ...node, x: newRelativeX, y: newRelativeY };
          }
          if (node.children && node.children.length > 0) {
            return { ...node, children: fallbackRecursive(node.children) };
          }
          return node;
        });
        return fallbackRecursive(prevNodes);
      }

      const oldX = draggedNodePreviousState.x || 0;
      const oldY = draggedNodePreviousState.y || 0;

      const deltaX = newRelativeX - oldX;
      const deltaY = newRelativeY - oldY;

      const updatePosRecursive = (currentNodesToUpdate) => currentNodesToUpdate.map(node => {
        if (node.id === nodeId) {
          const updatedChildren = (node.children || []).map(child => ({
            ...child,
            x: (child.x || 0) - deltaX,
            y: (child.y || 0) - deltaY,
          }));
          return { ...node, x: newRelativeX, y: newRelativeY, children: updatedChildren };
        }
        if (node.children && node.children.length > 0) {
          return { ...node, children: updatePosRecursive(node.children) };
        }
        return node;
      });
      return updatePosRecursive(prevNodes);
    });
  }, [setNodes, findNodeById]);

  const handleTextChange = useCallback((nodeId, newText) => {
    setNodes(prevNodes => {
      const updateTextRecursive = (currentNodesToUpdate) => currentNodesToUpdate.map(node => {
        if (node.id === nodeId) {
          return { ...node, text: newText };
        }
        if (node.children && node.children.length > 0) {
          return { ...node, children: updateTextRecursive(node.children) };
        }
        return node;
      });
      return updateTextRecursive(prevNodes);
    });
  }, [setNodes]);

  return {
    nodes,
    addNode,
    updateNodePosition,
    handleTextChange,
    findNodeById,
    findNodeAndAbsPos
  };
};
