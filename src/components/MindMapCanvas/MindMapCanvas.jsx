import React from 'react';
import Node from '../Node/Node';
import Arrow from '../Arrow/Arrow';
// import styles from './MindMapCanvas.module.css'; // Uncomment if you use specific styles

const MindMapCanvas = ({
  nodes,
  arrowData,
  handleTextChange,
  updateNodePosition,
  addNode,
  setNodeRef,
  leftPanelWidth,
  onNodeIsDragging,
  selectedNodeId, // Added for selection
  onNodeSelect    // Added for selection
}) => {

  const handleCanvasClick = () => {
    onNodeSelect(null); // Deselect any selected node
  };

  // Recursive rendering of nodes
  const renderNodeElements = (nodeList = nodes, currentParentAbsX = 0, currentParentAbsY = 0) => {
    return nodeList.map(node => {
      // Calculate the absolute position of the current node on the canvas
      const nodeAbsX = currentParentAbsX + (node.x || 0);
      const nodeAbsY = currentParentAbsY + (node.y || 0);
      return (
        <React.Fragment key={node.id}>
          <Node
            id={node.id}
            text={node.text}
            position={{ x: nodeAbsX, y: nodeAbsY }} // Pass node's ABSOLUTE canvas position
            // parentAbsX and parentAbsY props are removed from Node component
            onTextChange={newText => handleTextChange(node.id, newText)}
            // Node.jsx will now pass ABSOLUTE canvas position to this callback
            onPositionChange={(absoluteX, absoluteY) => updateNodePosition(node.id, absoluteX, absoluteY)}
            onAddNode={addNode}
            leftPanelWidth={leftPanelWidth}
            setNodeRef={el => setNodeRef(node.id, el)}
            onNodeIsDragging={onNodeIsDragging}
            isSelected={selectedNodeId === node.id}
            onSelect={() => onNodeSelect(node.id)}
          />
          {/* For children of *this* node, *their* logical parent's absolute position is nodeAbsX, nodeAbsY */}
          {node.children && node.children.length > 0 && renderNodeElements(node.children, nodeAbsX, nodeAbsY)}
        </React.Fragment>
      );
    });
  };

  return (
    <div className="mind-map" onClick={handleCanvasClick}> {/* This class might be global or from App.css/index.css */}
      <div className="node-layer"> {/* This class might be global or from App.css/index.css */}
        {renderNodeElements()}
        {arrowData.map(arrow => (
          <Arrow key={arrow.id} from={arrow.from} to={arrow.to} />
        ))}
      </div>
    </div>
  );
};

export default MindMapCanvas;
