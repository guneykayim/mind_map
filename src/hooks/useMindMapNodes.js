import { useState, useCallback, useEffect, useRef } from 'react';

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

// Helper function to find the optimal slot for a new node among siblings
const findOptimalSlotPosition = (relevantSiblings, newNodeSecondaryDimension, getSiblingPos, getSiblingDimension, NODE_GAP) => {
  if (relevantSiblings.length === 0) {
    return 0; // No siblings on this side, place at the center of the axis
  }

  let potentialSlots = [0]; // Start with parent's center on this axis
  relevantSiblings.forEach(sib => {
    const sibPos = getSiblingPos(sib);
    const sibDim = getSiblingDimension(sib);
    potentialSlots.push(sibPos + sibDim + NODE_GAP); // Slot after sibling
    potentialSlots.push(sibPos - newNodeSecondaryDimension - NODE_GAP); // Slot before sibling
  });
  potentialSlots = [...new Set(potentialSlots)]; // Unique slots

  const validSlots = potentialSlots.filter(slotStart => {
    const newNodeStart = slotStart;
    const newNodeEnd = slotStart + newNodeSecondaryDimension;
    let isCollision = false;
    for (const sib of relevantSiblings) {
      const sibStart = getSiblingPos(sib);
      const sibEnd = sibStart + getSiblingDimension(sib);
      // Check for overlap on the secondary axis
      if (newNodeStart < sibEnd && newNodeEnd > sibStart) {
        isCollision = true;
        break;
      }
    }
    return !isCollision;
  });

  if (validSlots.length > 0) {
    validSlots.sort((a, b) => {
      const absA = Math.abs(a);
      const absB = Math.abs(b);
      if (absA !== absB) return absA - absB; // Closest to 0
      return a >= 0 ? -1 : 1; // Prefer non-negative if abs values are equal
    });
    return validSlots[0];
  } else {
    // Fallback: place after the last relevant sibling on this axis
    const sortedByPos = [...relevantSiblings].sort((a, b) => getSiblingPos(a) - getSiblingPos(b));
    const lastRelevant = sortedByPos[sortedByPos.length - 1];
    return getSiblingPos(lastRelevant) + getSiblingDimension(lastRelevant) + NODE_GAP;
  }
};

export const useMindMapNodes = () => {
  const [nodes, setNodes] = useState(initialNodes);
  const [selectedNodeIds, setSelectedNodeIds] = useState([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [draggingNodeInfo, setDraggingNodeInfo] = useState(null);
  const draggingNodeInfoRef = useRef(draggingNodeInfo);
  useEffect(() => {
    draggingNodeInfoRef.current = draggingNodeInfo;
  }, [draggingNodeInfo]);

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

  const addNode = useCallback((parentId, direction, dims = {}) => { // dims contains parentWidth, parentHeight from the actual DOM element
    const newId = generateId();
    const defaultNewNodeWidth = 120;
    const defaultNewNodeHeight = 60;
    const NODE_GAP = 20;

    setHasUnsavedChanges(true);
    setNodes(prevNodes => {
      const updateNodeTree = (currentNodesToUpdate) => currentNodesToUpdate.map(node => {
        if (node.id === parentId) {
          const parentNode = node; // parentNode.x and parentNode.y are ABSOLUTE
          const parentAbsoluteX = parentNode.x || 0;
          const parentAbsoluteY = parentNode.y || 0;
          const siblings = parentNode.children || []; // Siblings also have absolute x, y

          const pWidth = dims.parentWidth || defaultNewNodeWidth; // Actual width of parent DOM element
          const pHeight = dims.parentHeight || defaultNewNodeHeight; // Actual height of parent DOM element

          let finalNewNodeX = 0;
          let finalNewNodeY = 0;
          let primaryOffset, secondaryOffset;

          if (direction === 'right' || direction === 'left') {
            primaryOffset = (direction === 'right') ? (pWidth + 80) : -(pWidth + 80); // This is x-offset
            
            const relevantSiblings = siblings.filter(sib => {
              const sibX = sib.x || 0;
              // Simplified: right means sib.x is generally to the right of parent's x, left means generally to the left.
              return direction === 'right' ? sibX >= parentAbsoluteX : sibX < parentAbsoluteX;
            });

            secondaryOffset = findOptimalSlotPosition(
              relevantSiblings,
              defaultNewNodeHeight, // New node's height
              (sib) => (sib.y || 0) - parentAbsoluteY, // Sibling's Y relative to parent's Y
              (sib) => sib.height || defaultNewNodeHeight, // Sibling's height
              NODE_GAP
            ); // This is y-offset relative to parent's y

            finalNewNodeX = parentAbsoluteX + primaryOffset;
            finalNewNodeY = parentAbsoluteY + secondaryOffset;

          } else { // Default fallback: place it relative to parent's top-right
            finalNewNodeX = parentAbsoluteX + pWidth + 80;
            finalNewNodeY = parentAbsoluteY;
          }

          let side;
          if (node.id === 'root') {
            side = direction;
          } else {
            side = node.side;
          }

          const newNode = {
            id: newId,
            text: 'New Node',
            x: finalNewNodeX, // Store absolute X
            y: finalNewNodeY, // Store absolute Y
            children: [],
            side,
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

  const handleNodeDrag = useCallback((dragInfo, nodeRefs) => {
    if (dragInfo === null) {
      // Drag ended. Clear styles on all selected nodes to revert to transform-based positioning.
      const lastDraggingInfo = draggingNodeInfoRef.current;
      if (lastDraggingInfo) { // Use the last known dragging info
        Object.keys(lastDraggingInfo).forEach(nodeId => {
          const nodeEl = nodeRefs[nodeId];
          if (nodeEl) {
            nodeEl.style.left = '';
            nodeEl.style.top = '';
            // No need to reset transform, it's managed by React state
          }
        });
      }
      setDraggingNodeInfo(null);
      return;
    }

    const { id, x, y } = dragInfo; // new absolute position for dragged node

    const draggedNodeInState = findNodeById(nodes, id);
    if (!draggedNodeInState) return;

    const dx = x - draggedNodeInState.x;
    const dy = y - draggedNodeInState.y;

    const nodesToMove = selectedNodeIds.includes(id) ? selectedNodeIds : [id];

    // For arrow updates
    const newArrowDraggingInfo = {};
    
    nodesToMove.forEach(nodeId => {
        const node = findNodeById(nodes, nodeId);
        if (node) {
            const newX = node.x + dx;
            const newY = node.y + dy;
            newArrowDraggingInfo[nodeId] = { x: newX, y: newY };

            // Visually update node position
            const nodeEl = nodeRefs[nodeId];
            if (nodeEl) {
                // The primary dragged node is updated within its own component
                // for responsiveness. We only need to update the other nodes.
                if (nodeId !== id) {
                    nodeEl.style.left = `${newX}px`;
                    nodeEl.style.top = `${newY}px`;
                    nodeEl.style.transform = '';
                }
            }
        }
    });

    setDraggingNodeInfo(newArrowDraggingInfo);
  }, [nodes, selectedNodeIds, findNodeById]);

  const updateNodePosition = useCallback((nodeId, newAbsoluteX, newAbsoluteY) => {
    setHasUnsavedChanges(true);
    setNodes(prevNodes => {
      const draggedNode = findNodeById(prevNodes, nodeId);
      if (!draggedNode) return prevNodes;

      const dx = newAbsoluteX - draggedNode.x;
      const dy = newAbsoluteY - draggedNode.y;

      const nodesToMove = selectedNodeIds.includes(nodeId) ? selectedNodeIds : [nodeId];
      const nodesToMoveSet = new Set(nodesToMove);

      const updatePosRecursive = (nodesToUpdate) => {
        return nodesToUpdate.map(node => {
          let newNode = { ...node };
          if (nodesToMoveSet.has(node.id)) {
            newNode.x = (node.x || 0) + dx;
            newNode.y = (node.y || 0) + dy;
          }
          if (node.children && node.children.length > 0) {
            newNode.children = updatePosRecursive(node.children);
          }
          return newNode;
        });
      };
      return updatePosRecursive(prevNodes);
    });
  }, [setNodes, selectedNodeIds, findNodeById]);

  const handleTextChange = useCallback((nodeId, newText) => {
    setHasUnsavedChanges(true);
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
    setHasUnsavedChanges(true);
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

    const handleNodeSelection = useCallback((nodeId, isShiftPressed) => {
    setSelectedNodeIds(prevSelectedIds => {
            if (isShiftPressed) {
        const isSelected = prevSelectedIds.includes(nodeId);
        if (isSelected) {
          return prevSelectedIds.filter(id => id !== nodeId); // Toggle off
        } else {
          return [...prevSelectedIds, nodeId]; // Toggle on
        }
      }
      // Not ctrl-pressed, select only this one
      // If it's already the only one selected, deselect it. Otherwise, select just it.
      if (prevSelectedIds.length === 1 && prevSelectedIds[0] === nodeId) {
        return [];
      }
      return [nodeId];
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedNodeIds([]);
  }, []);

  // Function to get node text by ID
  const getNodeTextById = useCallback((nodeId) => {
    const node = findNodeById(nodes, nodeId);
    return node ? node.text : `node with ID "${nodeId}"`;
  }, [nodes, findNodeById]);

  // Function to delete multiple nodes by their IDs
  const deleteMultipleNodes = useCallback((nodeIds) => {
    setHasUnsavedChanges(true);
    setNodes(prevNodes => {
      const recursivelyDeleteMultiple = (currentNodes, targetIds) => {
        if (!currentNodes || currentNodes.length === 0) {
          return [];
        }
        const targetIdsSet = new Set(targetIds);
        
        return currentNodes
          .filter(node => !targetIdsSet.has(node.id)) // Remove nodes that are in the delete list
          .map(node => ({
            ...node,
            children: node.children ? recursivelyDeleteMultiple(node.children, targetIds) : [] // Process children
          }));
      };
      return recursivelyDeleteMultiple(prevNodes, nodeIds);
    });
  }, [setNodes]);

  const deleteSelectedNodes = useCallback(() => {
    if (selectedNodeIds.length === 0) return;
    setHasUnsavedChanges(true);
    setNodes(prevNodes => {
      const recursivelyDeleteMultiple = (currentNodes, targetIds) => {
        if (!currentNodes || currentNodes.length === 0) {
          return [];
        }
        const targetIdsSet = new Set(targetIds);
        
        return currentNodes
          .filter(node => !targetIdsSet.has(node.id)) // Remove nodes that are in the delete list
          .map(node => ({
            ...node,
            children: node.children ? recursivelyDeleteMultiple(node.children, targetIds) : [] // Process children
          }));
      };
      return recursivelyDeleteMultiple(prevNodes, new Set(selectedNodeIds));
    });
    setSelectedNodeIds([]); // Clear selection after deletion
  }, [selectedNodeIds]);

  // Handle keydown events for node deletion
  useEffect(() => {
    const handleKeyDown = (event) => {
      const targetTagName = event.target.tagName.toLowerCase();
      if (targetTagName === 'input' || targetTagName === 'textarea') {
        return;
      }

      if ((event.key === 'Delete' || event.key === 'Backspace') && selectedNodeIds.length > 0) {
        // Prevent default for Backspace to avoid browser back navigation
        if (event.key === 'Backspace') {
          event.preventDefault();
        }

        // Filter out root node from deletion
        const nodesToDelete = selectedNodeIds.filter(id => id !== 'root');
        
        if (nodesToDelete.length === 0) {
          if (selectedNodeIds.includes('root')) {
            alert("The root node cannot be deleted.");
          }
          return; // Only root was selected, do nothing
        }

        // Create confirmation message
        let confirmationMessage;
        if (nodesToDelete.length === 1) {
          const nodeText = getNodeTextById(nodesToDelete[0]);
          confirmationMessage = `Are you sure you want to delete node "${nodeText}" and all its children?`;
        } else {
          const nodeTexts = nodesToDelete
            .slice(0, 3)
            .map(id => `"${getNodeTextById(id)}"`);
          const moreText = nodesToDelete.length > 3 ? ` and ${nodesToDelete.length - 3} more` : '';
          confirmationMessage = `Are you sure you want to delete ${nodesToDelete.length} nodes (${nodeTexts.join(', ')}${moreText}) and all their children?`;
        }

        if (window.confirm(confirmationMessage)) {
          deleteMultipleNodes(nodesToDelete);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedNodeIds, deleteSelectedNodes]);

  // Warn user about unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (event) => {
      if (hasUnsavedChanges) {
        event.preventDefault();
        event.returnValue = ''; // For modern browsers
        return ''; // For older browsers
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasUnsavedChanges]);

  return {
    nodes,
    addNode,
    updateNodePosition,
    handleTextChange,
    findNodeById,
    selectedNodeIds,
    handleNodeSelection,
    clearSelection,
    setSelectedNodeIds,
    deleteSelectedNodes,
    hasUnsavedChanges,
    draggingNodeInfo,
    handleNodeDrag,
  };
};
