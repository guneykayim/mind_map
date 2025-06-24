import { useState, useCallback } from 'react';

export const useNodeSelection = () => {
    const [selectedNodeIds, setSelectedNodeIds] = useState([]);

    const handleNodeSelection = useCallback((event, nodeId) => {
        setSelectedNodeIds(prevSelectedIds => {
            if (event.shiftKey) {
                const isSelected = prevSelectedIds.includes(nodeId);
                if (isSelected) {
                    return prevSelectedIds.filter(id => id !== nodeId); // Toggle off
                } else {
                    return [...prevSelectedIds, nodeId]; // Toggle on
                }
            }
            // Not shift-pressed, select only this one
            if (prevSelectedIds.length === 1 && prevSelectedIds[0] === nodeId) {
                return [];
            }
            return [nodeId];
        });
    }, []);

    const clearSelection = useCallback(() => {
        setSelectedNodeIds([]);
    }, []);

    return {
        selectedNodeIds,
        setSelectedNodeIds,
        handleNodeSelection,
        clearSelection,
    };
}; 