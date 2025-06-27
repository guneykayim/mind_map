import { useState, useCallback, useEffect, useRef } from 'react';
import { 
    findNodeById,
    addNodeRecursive,
    updatePositionRecursive,
    updateTextRecursive,
    deleteMultipleRecursive
} from '../utils/nodeTreeUtils';
import { useNodeSelection } from './useNodeSelection';
import { useNodeDrag } from './useNodeDrag';
import { useMindMapEventListeners } from './useMindMapEventListeners';
import { useHistory } from './useHistory';

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

export const useMindMapNodes = (showConfirmation) => {
  const { 
    state: nodes,
    setState: setNodes, 
    undo, 
    redo,
    canUndo,
    canRedo 
  } = useHistory(initialNodes);
  const {
    selectedNodeIds,
    setSelectedNodeIds,
    handleNodeSelection,
    clearSelection,
  } = useNodeSelection();
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  const { draggingNodeInfo, handleNodeDrag } = useNodeDrag(nodes, selectedNodeIds);

  const addNode = useCallback((parentId, direction, dims = {}) => {
    const newNode = {
      id: generateId(),
      text: 'New Node',
      children: [],
    };
    setHasUnsavedChanges(true);
    setNodes(prevNodes => addNodeRecursive(prevNodes, parentId, direction, dims, newNode));
  }, [setNodes]);

  const updateNodePosition = useCallback((nodeId, newAbsoluteX, newAbsoluteY, overwriteHistory = false) => {
    setHasUnsavedChanges(true);
    setNodes(prevNodes => {
      const draggedNode = findNodeById(prevNodes, nodeId);
      if (!draggedNode) return prevNodes;

      const dx = newAbsoluteX - draggedNode.x;
      const dy = newAbsoluteY - draggedNode.y;

      const nodesToMove = selectedNodeIds.includes(nodeId) ? selectedNodeIds : [nodeId];
      const nodesToMoveSet = new Set(nodesToMove);

      return updatePositionRecursive(prevNodes, nodesToMoveSet, dx, dy);
    }, overwriteHistory);
  }, [setNodes, selectedNodeIds]);

  const handleTextChange = useCallback((nodeId, newText) => {
    setHasUnsavedChanges(true);
    setNodes(prevNodes => updateTextRecursive(prevNodes, nodeId, newText));
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

  const deleteMultipleNodes = useCallback((nodeIds) => {
    setHasUnsavedChanges(true);
    setNodes(prevNodes => deleteMultipleRecursive(prevNodes, new Set(nodeIds)));
  }, [setNodes]);

  const clearCanvas = useCallback(() => {
    setNodes(initialNodes);
    setSelectedNodeIds([]);
    setHasUnsavedChanges(true);
  }, [setNodes, setSelectedNodeIds, setHasUnsavedChanges]);

  const deleteSelectedNodes = useCallback(() => {
    if (selectedNodeIds.length === 0) return;
    deleteMultipleNodes(selectedNodeIds);
    setSelectedNodeIds([]); // Clear selection after deletion
  }, [selectedNodeIds, setSelectedNodeIds, deleteMultipleNodes]);

  useMindMapEventListeners(nodes, selectedNodeIds, deleteMultipleNodes, showConfirmation);

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

  const serialize = useCallback(() => {
    return JSON.stringify(nodes, null, 2);
  }, [nodes]);

  const deserialize = useCallback((serializedData) => {
    try {
      const loadedNodes = JSON.parse(serializedData);
      // Basic validation
      if (Array.isArray(loadedNodes) && loadedNodes.length > 0) {
        setNodes(loadedNodes);
        setSelectedNodeIds([]);
        setHasUnsavedChanges(false);
      } else {
        alert("Invalid or empty mind map data.");
      }
    } catch (error) {
      console.error("Failed to deserialize mind map data:", error);
      alert("Failed to load mind map. The file might be corrupted or in the wrong format.");
    }
  }, [setNodes, setSelectedNodeIds, setHasUnsavedChanges]);

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
    deleteMultipleNodes,
    serialize,
    deserialize,
    clearCanvas,
    undo,
    redo,
    canUndo,
    canRedo,
  };
};
