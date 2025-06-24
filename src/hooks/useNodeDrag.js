import { useState, useCallback, useRef, useEffect } from 'react';
import { findNodeById } from '../utils/nodeTreeUtils';

export const useNodeDrag = (nodes, selectedNodeIds) => {
    const [draggingNodeInfo, setDraggingNodeInfo] = useState(null);
    const draggingNodeInfoRef = useRef(draggingNodeInfo);

    useEffect(() => {
        draggingNodeInfoRef.current = draggingNodeInfo;
    }, [draggingNodeInfo]);

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
        const newArrowDraggingInfo = {};

        nodesToMove.forEach(nodeId => {
            const node = findNodeById(nodes, nodeId);
            if (node) {
                const newX = node.x + dx;
                const newY = node.y + dy;
                newArrowDraggingInfo[nodeId] = { x: newX, y: newY };

                const nodeEl = nodeRefs[nodeId];
                if (nodeEl) {
                    if (nodeId !== id) {
                        nodeEl.style.left = `${newX}px`;
                        nodeEl.style.top = `${newY}px`;
                        nodeEl.style.transform = '';
                    }
                }
            }
        });

        setDraggingNodeInfo(newArrowDraggingInfo);
    }, [nodes, selectedNodeIds]);

    return {
        draggingNodeInfo,
        handleNodeDrag,
    };
}; 