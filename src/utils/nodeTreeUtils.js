// Helper function to find a node by its ID in a tree structure
export const findNodeById = (nodeList, nodeId) => {
  for (const node of nodeList) {
    if (node.id === nodeId) return node;
    if (node.children) {
      const found = findNodeById(node.children, nodeId);
      if (found) return found;
    }
  }
  return null;
};

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

// Recursive function to add a new node
export const addNodeRecursive = (nodes, parentId, direction, dims, newNode) => {
    return nodes.map(node => {
        if (node.id === parentId) {
            const parentNode = node;
            const parentAbsoluteX = parentNode.x || 0;
            const parentAbsoluteY = parentNode.y || 0;
            const siblings = parentNode.children || [];

            const pWidth = dims.parentWidth || 120;
            const pHeight = dims.parentHeight || 60;
            const NODE_GAP = 20;

            let finalNewNodeX = 0;
            let finalNewNodeY = 0;
            let primaryOffset, secondaryOffset;

            if (direction === 'right' || direction === 'left') {
                primaryOffset = (direction === 'right') ? (pWidth + 80) : -(pWidth + 80);
                
                const relevantSiblings = siblings.filter(sib => {
                    const sibX = sib.x || 0;
                    return direction === 'right' ? sibX >= parentAbsoluteX : sibX < parentAbsoluteX;
                });

                secondaryOffset = findOptimalSlotPosition(
                    relevantSiblings,
                    60, // New node's height
                    (sib) => (sib.y || 0) - parentAbsoluteY,
                    (sib) => sib.height || 60,
                    NODE_GAP
                );

                finalNewNodeX = parentAbsoluteX + primaryOffset;
                finalNewNodeY = parentAbsoluteY + secondaryOffset;
            } else {
                finalNewNodeX = parentAbsoluteX + pWidth + 80;
                finalNewNodeY = parentAbsoluteY;
            }
            
            let side = (node.id === 'root') ? direction : node.side;
            const finalNewNode = { ...newNode, x: finalNewNodeX, y: finalNewNodeY, side };

            return { ...parentNode, children: [...siblings, finalNewNode] };
        }
        if (node.children && node.children.length > 0) {
            return { ...node, children: addNodeRecursive(node.children, parentId, direction, dims, newNode) };
        }
        return node;
    });
};

// Recursive function to update node position
export const updatePositionRecursive = (nodes, nodesToMoveSet, dx, dy) => {
    return nodes.map(node => {
      let newNode = { ...node };
      if (nodesToMoveSet.has(node.id)) {
        newNode.x = (node.x || 0) + dx;
        newNode.y = (node.y || 0) + dy;
      }
      if (node.children && node.children.length > 0) {
        newNode.children = updatePositionRecursive(node.children, nodesToMoveSet, dx, dy);
      }
      return newNode;
    });
};

// Recursive function to update node text
export const updateTextRecursive = (nodes, nodeId, newText) => {
    return nodes.map(node => {
      if (node.id === nodeId) {
        return { ...node, text: newText };
      }
      if (node.children && node.children.length > 0) {
        return { ...node, children: updateTextRecursive(node.children, nodeId, newText) };
      }
      return node;
    });
};

// Recursive function to delete multiple nodes
export const deleteMultipleRecursive = (nodes, targetIdsSet) => {
    if (!nodes || nodes.length === 0) {
      return [];
    }
    return nodes
      .filter(node => !targetIdsSet.has(node.id))
      .map(node => ({
        ...node,
        children: node.children ? deleteMultipleRecursive(node.children, targetIdsSet) : []
      }));
};

export const flattenNodes = (nodes) => {
  let flatList = [];
  const queue = [...(nodes || [])];
  while (queue.length > 0) {
    const node = queue.shift();
    flatList.push(node);
    if (node.children) {
      queue.push(...node.children);
    }
  }
  return flatList;
};

export const findPathToNode = (nodes, nodeId) => {
  for (const node of nodes) {
    if (node.id === nodeId) return [node];
    if (node.children) {
      const path = findPathToNode(node.children, nodeId);
      if (path && path.length > 0) return [node, ...path];
    }
  }
  return null;
};

export const getDescendantsAndSelf = (node) => {
  let descendants = [node];
  if (node.children) {
    for (const child of node.children) {
      descendants.push(...getDescendantsAndSelf(child));
    }
  }
  return descendants;
};

export const checkCollision = (nodeA, nodeB) => {
  const nodeAWidth = nodeA.width || 120;
  const nodeAHeight = nodeA.height || 60;
  const nodeBWidth = nodeB.width || 120;
  const nodeBHeight = nodeB.height || 60;

  return (
    nodeA.x < nodeB.x + nodeBWidth &&
    nodeA.x + nodeAWidth > nodeB.x &&
    nodeA.y < nodeB.y + nodeBHeight &&
    nodeA.y + nodeAHeight > nodeB.y
  );
}; 