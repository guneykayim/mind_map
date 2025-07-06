import { useState, useCallback, useEffect, useRef } from 'react';
import { 
    findNodeById,
    addNodeRecursive,
    updatePositionRecursive,
    updateTextRecursive,
    deleteMultipleRecursive,
    flattenNodes,
    findPathToNode,
    getDescendantsAndSelf,
    checkCollision
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
    text: 'Start Here',
    x: 0,
    y: 0,
    children: []
  }
];

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
    const newNodeInfo = {
      id: generateId(),
      text: 'New Node',
      children: [],
      width: 120,
      height: 60
    };
    setHasUnsavedChanges(true);
    setNodes(prevNodes => {
      const MAX_ITERATIONS = 10;
      let iterations = 0;
      let newNodes = JSON.parse(JSON.stringify(prevNodes));
      let collisionFound;

      // Initial placement of the new node
      newNodes = addNodeRecursive(newNodes, parentId, direction, dims, newNodeInfo);

      do {
        collisionFound = false;
        const allNodes = flattenNodes(newNodes);
        const newNode = allNodes.find(n => n.id === newNodeInfo.id);

        if (!newNode) {
          console.error("Newly added node not found. Aborting collision check.");
          break; 
        }

        for (const existingNode of allNodes) {
          if (existingNode.id === newNode.id || existingNode.id === parentId) continue;

          if (checkCollision(newNode, existingNode)) {
            collisionFound = true;
            
            const parentPath = findPathToNode(newNodes, parentId);
            const existingPath = findPathToNode(newNodes, existingNode.id);

            if (!parentPath || !existingPath) continue;
            
            let commonAncestor, parentSubRoot, conflictSubRoot;
            for (let i = 0; i < Math.min(parentPath.length, existingPath.length); i++) {
              if (parentPath[i].id !== existingPath[i].id) break;
              commonAncestor = parentPath[i];
              parentSubRoot = parentPath[i + 1];
              conflictSubRoot = existingPath[i + 1];
            }

            if (!commonAncestor || !conflictSubRoot || !parentSubRoot) continue;
            if (parentSubRoot.id === conflictSubRoot.id) continue;

            // All children of the common ancestor that are on the same side as the new node.
            const side = parentSubRoot.side;
            const childrenOnSide = (commonAncestor.children || []).filter(c => c.side === side);
            
            const moveConflictUp = conflictSubRoot.y < parentSubRoot.y;
            
            let nodesToShiftRoots;
            if (moveConflictUp) {
              // The conflicting branch is above the new node's branch, so it and everything above it gets moved up.
              nodesToShiftRoots = childrenOnSide.filter(child => child.y <= conflictSubRoot.y);
            } else {
              // The conflicting branch is below, so it and everything below it gets moved down.
              nodesToShiftRoots = childrenOnSide.filter(child => child.y >= conflictSubRoot.y);
            }
            
            // The branch for the new node should not be moved.
            const finalNodesToShift = nodesToShiftRoots.filter(n => n.id !== parentSubRoot.id);
            
            const nodesToMoveSet = new Set();
            for (const root of finalNodesToShift) {
              const descendants = getDescendantsAndSelf(root);
              for (const descendant of descendants) {
                nodesToMoveSet.add(descendant.id);
              }
            }
            
            const dy = (newNode.height || 60) + 20;
            const shiftY = moveConflictUp ? -dy : dy;

            if (nodesToMoveSet.size > 0) {
              newNodes = updatePositionRecursive(newNodes, nodesToMoveSet, 0, shiftY);
            }

            newNodes = deleteMultipleRecursive(newNodes, new Set([newNode.id]));
            newNodes = addNodeRecursive(newNodes, parentId, direction, dims, newNodeInfo);
            
            break; 
          }
        }
        iterations++;
      } while (collisionFound && iterations < MAX_ITERATIONS);

      if (iterations >= MAX_ITERATIONS) {
        console.warn("Max iterations reached in collision avoidance. There might be an unresolvable overlap.");
      }

      return newNodes;
    });
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
