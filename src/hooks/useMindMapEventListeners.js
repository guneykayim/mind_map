import { useEffect, useCallback } from 'react';
import { findNodeById } from '../utils/nodeTreeUtils';

export const useMindMapEventListeners = (nodes, selectedNodeIds, deleteMultipleNodes) => {
    
    const getNodeTextById = useCallback((nodeId) => {
        const node = findNodeById(nodes, nodeId);
        return node ? node.text : `node with ID "${nodeId}"`;
    }, [nodes]);

    useEffect(() => {
        const handleKeyDown = (event) => {
            const targetTagName = event.target.tagName.toLowerCase();
            if (targetTagName === 'input' || targetTagName === 'textarea') {
                return;
            }

            if ((event.key === 'Delete' || event.key === 'Backspace') && selectedNodeIds.length > 0) {
                if (event.key === 'Backspace') {
                    event.preventDefault();
                }

                const nodesToDelete = selectedNodeIds.filter(id => id !== 'root');

                if (nodesToDelete.length === 0) {
                    if (selectedNodeIds.includes('root')) {
                        alert("The root node cannot be deleted.");
                    }
                    return;
                }

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
    }, [selectedNodeIds, deleteMultipleNodes, getNodeTextById]);
}; 