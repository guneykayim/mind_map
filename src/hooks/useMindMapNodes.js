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
      function findParent(nodeList) {
        for (const node of nodeList) {
          if (node.id === parentId) return node;
          if (node.children) {
            const found = findParent(node.children);
            if (found) return found;
          }
        }
        return null;
      }
      const parentNode = findParent(prevNodes);
      let deltaX = 0, deltaY = 0;
      if (parentNode && typeof dims.latestX === 'number' && typeof dims.latestY === 'number') {
        deltaX = dims.latestX - (parentNode.x || 0);
        deltaY = dims.latestY - (parentNode.y || 0);
      }

      const updateNodeTree = (currentNodes) => currentNodes.map(node => {
        if (node.id === parentId) {
          const newNode = {
            id: newId,
            text: 'New Node',
            x: x + deltaX,
            y: y + deltaY,
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

  const updateNodePosition = useCallback((nodeId, newX, newY) => {
    setNodes(prevNodes => {
      const updatePosRecursive = (currentNodes) => currentNodes.map(node => {
        if (node.id === nodeId) {
          return { ...node, x: newX, y: newY };
        }
        if (node.children && node.children.length > 0) {
          return { ...node, children: updatePosRecursive(node.children) };
        }
        return node;
      });
      return updatePosRecursive(prevNodes);
    });
  }, [setNodes]);

  const handleTextChange = useCallback((nodeId, newText) => {
    setNodes(prevNodes => {
      const updateTextRecursive = (currentNodes) => currentNodes.map(node => {
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

  const findNodeAndAbsPos = useCallback((targetNodeId, currentNodes = nodes, parentAbs = {x:0, y:0}) => {
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
  }, [nodes]); // Depends on `nodes` for its default argument

  return {
    nodes,
    addNode,
    updateNodePosition,
    handleTextChange,
    findNodeById,
    findNodeAndAbsPos
  };
};
