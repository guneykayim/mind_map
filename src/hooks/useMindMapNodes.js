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
    const defaultNewNodeWidth = 120;
    const defaultNewNodeHeight = 60;
    const NODE_GAP = 20;

    setNodes(prevNodes => {
      const updateNodeTree = (currentNodesToUpdate) => currentNodesToUpdate.map(node => {
        if (node.id === parentId) {
          const parentNode = node;
          const siblings = parentNode.children || [];
          let newX = 0;
          let newY = 0;

          const pWidth = dims.parentWidth || defaultNewNodeWidth;
          const pHeight = dims.parentHeight || defaultNewNodeHeight;

          if (direction === 'right' || direction === 'left') {
            newX = (direction === 'right') ? (pWidth + 80) : -(defaultNewNodeWidth + 80);
            // Filter siblings to only those on the same side (right: x >= 0, left: x < 0)
            const relevantSiblings = siblings.filter(sib => {
              return direction === 'right' ? (sib.x || 0) >= 0 : (sib.x || 0) < 0;
            });

            if (relevantSiblings.length === 0) {
              newY = 0;
            } else {
              let potentialYSlots = [0]; // Start with parent's center
              relevantSiblings.forEach(sib => {
                const sibY = sib.y || 0;
                const sibHeight = sib.height || defaultNewNodeHeight;
                potentialYSlots.push(sibY + sibHeight + NODE_GAP); // Below sibling
                potentialYSlots.push(sibY - defaultNewNodeHeight - NODE_GAP); // Above sibling
              });
              potentialYSlots = [...new Set(potentialYSlots)]; // Unique slots

              const validYSlots = potentialYSlots.filter(yStart => {
                const newNodeTop = yStart;
                const newNodeBottom = yStart + defaultNewNodeHeight;
                let isCollision = false;
                for (const sib of relevantSiblings) {
                  const sibTop = sib.y || 0;
                  const sibHeight = sib.height || defaultNewNodeHeight;
                  const sibBottom = sibTop + sibHeight;
                  if (newNodeTop < sibBottom && newNodeBottom > sibTop) {
                    isCollision = true;
                    break;
                  }
                }
                return !isCollision;
              });

              if (validYSlots.length > 0) {
                validYSlots.sort((a, b) => {
                  const absA = Math.abs(a);
                  const absB = Math.abs(b);
                  if (absA !== absB) return absA - absB;
                  return a >= 0 ? -1 : 1; // Prefer non-negative if abs values are equal
                });
                newY = validYSlots[0];
              } else {
                // Fallback: place below the lowest relevant sibling
                const sortedByY = [...relevantSiblings].sort((a,b) => (a.y || 0) - (b.y || 0));
                const lastRelevant = sortedByY[sortedByY.length -1];
                newY = (lastRelevant.y || 0) + (lastRelevant.height || defaultNewNodeHeight) + NODE_GAP;
              }
            }
          } else if (direction === 'top' || direction === 'bottom') {
            newY = (direction === 'bottom') ? (pHeight + 80) : -(defaultNewNodeHeight + 80);
            // Filter siblings to only those on the same side (bottom: y >= 0, top: y < 0)
            const relevantSiblings = siblings.filter(sib => {
              return direction === 'bottom' ? (sib.y || 0) >= 0 : (sib.y || 0) < 0;
            });

            if (relevantSiblings.length === 0) {
              newX = 0;
            } else {
              let potentialXSlots = [0]; // Start with parent's center
              relevantSiblings.forEach(sib => {
                const sibX = sib.x || 0;
                const sibWidth = sib.width || defaultNewNodeWidth;
                potentialXSlots.push(sibX + sibWidth + NODE_GAP); // Right of sibling
                potentialXSlots.push(sibX - defaultNewNodeWidth - NODE_GAP); // Left of sibling
              });
              potentialXSlots = [...new Set(potentialXSlots)]; // Unique slots

              const validXSlots = potentialXSlots.filter(xStart => {
                const newNodeLeft = xStart;
                const newNodeRight = xStart + defaultNewNodeWidth;
                let isCollision = false;
                for (const sib of relevantSiblings) {
                  const sibLeft = sib.x || 0;
                  const sibWidth = sib.width || defaultNewNodeWidth;
                  const sibRight = sibLeft + sibWidth;
                  if (newNodeLeft < sibRight && newNodeRight > sibLeft) {
                    isCollision = true;
                    break;
                  }
                }
                return !isCollision;
              });

              if (validXSlots.length > 0) {
                validXSlots.sort((a, b) => {
                  const absA = Math.abs(a);
                  const absB = Math.abs(b);
                  if (absA !== absB) return absA - absB;
                  return a >= 0 ? -1 : 1; // Prefer non-negative if abs values are equal
                });
                newX = validXSlots[0];
              } else {
                // Fallback: place to the right of the rightmost relevant sibling
                const sortedByX = [...relevantSiblings].sort((a,b) => (a.x || 0) - (b.x || 0));
                const lastRelevant = sortedByX[sortedByX.length - 1];
                newX = (lastRelevant.x || 0) + (lastRelevant.width || defaultNewNodeWidth) + NODE_GAP;
              }
            }
          } else { // Default fallback for unknown direction
            newX = pWidth + 80;
            newY = 0;
          }

          const newNode = {
            id: newId,
            text: 'New Node',
            x: newX,
            y: newY,
            children: []
          };
          return {
            ...parentNode,
            children: [...siblings, newNode]
          };
        }
        if (node.children && node.children.length > 0) {
          return { ...node, children: updateNodeTree(node.children) };
        }
        return node;
      });
      return updateNodeTree(prevNodes);
    });
  }, [setNodes]);

  // Helper function to find the absolute position of a node's parent
  const findParentAbsolutePosition = (nodesToSearch, childId, currentParentAbsX = 0, currentParentAbsY = 0) => {
    for (const node of nodesToSearch) {
      const nodeAbsX = currentParentAbsX + (node.x || 0);
      const nodeAbsY = currentParentAbsY + (node.y || 0);
      if (node.children && node.children.some(child => child.id === childId)) {
        return { x: nodeAbsX, y: nodeAbsY }; // Found parent, return its absolute position
      }
      if (node.children && node.children.length > 0) {
        const foundInChildren = findParentAbsolutePosition(node.children, childId, nodeAbsX, nodeAbsY);
        if (foundInChildren) {
          return foundInChildren;
        }
      }
    }
    return null; // No parent found (e.g., childId is a root node or not found)
  };

  const updateNodePosition = useCallback((nodeId, newAbsoluteX, newAbsoluteY) => {
    setNodes(prevNodes => {
      const parentAbsPos = findParentAbsolutePosition(prevNodes, nodeId);
      let parentAbsoluteX = 0;
      let parentAbsoluteY = 0;

      if (parentAbsPos) {
        parentAbsoluteX = parentAbsPos.x;
        parentAbsoluteY = parentAbsPos.y;
      } // If null, it's a root node, parent abs pos is (0,0) relative to canvas origin

      const newRelativeX = newAbsoluteX - parentAbsoluteX;
      const newRelativeY = newAbsoluteY - parentAbsoluteY;

      const draggedNodePreviousState = findNodeById(prevNodes, nodeId);

      if (!draggedNodePreviousState) {
        console.warn(`Node with id ${nodeId} not found for position update.`);
        const fallbackRecursive = (currentNodesToUpdate) => currentNodesToUpdate.map(n => {
          if (n.id === nodeId) return { ...n, x: newRelativeX, y: newRelativeY }; // Attempt simple update
          if (n.children) return { ...n, children: fallbackRecursive(n.children) };
          return n;
        });
        return fallbackRecursive(prevNodes);
      }

      const oldRelativeX = draggedNodePreviousState.x || 0;
      const oldRelativeY = draggedNodePreviousState.y || 0;

      const deltaRelativeX = newRelativeX - oldRelativeX;
      const deltaRelativeY = newRelativeY - oldRelativeY;

      const updatePosRecursive = (currentNodesToUpdate) => currentNodesToUpdate.map(node => {
        if (node.id === nodeId) {
          const updatedChildren = (node.children || []).map(child => ({
            ...child,
            x: (child.x || 0) - deltaRelativeX,
            y: (child.y || 0) - deltaRelativeY,
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
  }, [setNodes, findNodeById, findParentAbsolutePosition]);

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

  const deleteNode = useCallback((nodeIdToDelete) => {
    setNodes(prevNodes => {
      const recursivelyDelete = (currentNodes, targetId) => {
        if (!currentNodes || currentNodes.length === 0) {
          return [];
        }
        const newNodesList = [];
        for (const node of currentNodes) {
          if (node.id === targetId) {
            // Node found, do not include it or its children
            continue;
          }
          // Node is not the target, keep it and process its children
          const updatedChildren = node.children ? recursivelyDelete(node.children, targetId) : [];
          newNodesList.push({ ...node, children: updatedChildren });
        }
        return newNodesList;
      };
      return recursivelyDelete(prevNodes, nodeIdToDelete);
    });
  }, [setNodes]);

  return {
    nodes,
    addNode,
    updateNodePosition,
    handleTextChange,
    findNodeById,
    findNodeAndAbsPos,
    deleteNode
  };
};
