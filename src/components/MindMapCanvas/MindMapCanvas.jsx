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
  const renderNodeElements = (nodeList = nodes, parentX = 0, parentY = 0) => {
    return nodeList.map(node => {
      const nodeX = parentX + (node.x || 0);
      const nodeY = parentY + (node.y || 0);
      return (
        <React.Fragment key={node.id}>
          <Node
            id={node.id}
            text={node.text}
            position={{ x: nodeX, y: nodeY }}
            onTextChange={newText => handleTextChange(node.id, newText)}
            onPositionChange={(x, y) => updateNodePosition(node.id, x - parentX, y - parentY)}
            onAddNode={addNode}
            leftPanelWidth={leftPanelWidth}
            setNodeRef={el => setNodeRef(node.id, el)}
            onNodeIsDragging={onNodeIsDragging}
            isSelected={selectedNodeId === node.id}
            onSelect={() => onNodeSelect(node.id)}
          />
          {node.children && node.children.length > 0 && renderNodeElements(node.children, nodeX, nodeY)}
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
