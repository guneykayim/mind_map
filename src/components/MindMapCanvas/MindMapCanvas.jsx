import React from 'react';
import Node from '../Node/Node';
import Arrow from '../Arrow/Arrow';
// import styles from './MindMapCanvas.module.css'; // Uncomment if you use specific styles

const MindMapCanvas = ({
  zoomLevel, // Add zoomLevel to props
  nodes,
  arrowData,
  handleTextChange,
  updateNodePosition,
  addNode,
  setNodeRef,
  leftPanelWidth,
  onNodeIsDragging,
  selectedNodeId, // Added for selection
  onNodeSelect,    // Added for selection
  canvasContentRef // Add canvasContentRef to props
}) => {

  const canvasStyle = {
    transform: `scale(${zoomLevel})`,
    transformOrigin: 'top left', // Or 'center center' depending on desired zoom behavior
    // Ensure the container itself doesn't shrink or grow with content, but acts as a viewport
    width: '100%', 
    height: '100%',
    // position: 'relative', // May be needed depending on how arrows/nodes are positioned
  };

  const handleCanvasClick = () => {
    onNodeSelect(null); // Deselect any selected node
  };

  // Recursive rendering of nodes
  const renderNodeElements = (nodeList = nodes) => {
    return nodeList.map(node => {
      if (!node || typeof node.id === 'undefined') {
        console.error('Invalid node encountered in renderNodeElements:', node);
        return null; // Skip rendering this invalid node
      }

      // node.x and node.y are now ABSOLUTE positions

      return (
        <React.Fragment key={node.id}>
          <Node
            id={node.id}
            text={node.text || ''}
            position={{ x: node.x || 0, y: node.y || 0 }} // Pass absolute position directly
            onTextChange={newText => handleTextChange(node.id, newText)}
            onPositionChange={(absoluteX, absoluteY) => updateNodePosition(node.id, absoluteX, absoluteY)}
            onAddNode={addNode}
            setNodeRef={el => setNodeRef(node.id, el)}
            onNodeIsDragging={onNodeIsDragging}
            isSelected={selectedNodeId === node.id}
            onSelect={() => onNodeSelect(node.id)}
            zoomLevel={zoomLevel} // Pass zoomLevel
            canvasContentRef={canvasContentRef} // Pass canvasContentRef
          />
          {/* Recursively render children. The parent's absolute position is not needed for child's positioning anymore */}
          {node.children && node.children.length > 0 && renderNodeElements(node.children)}
        </React.Fragment>
      );
    });
  };

  return (
    <div className="mind-map" onClick={handleCanvasClick}> 
      <div ref={canvasContentRef} style={canvasStyle} className="mind-map-content-container"> 
        {/* Render arrows first so they appear behind nodes if overlapping */}
        {arrowData.map(arrow => (
          <Arrow key={arrow.id} from={arrow.from} to={arrow.to} />
        ))}
        <div className="node-layer"> 
          {renderNodeElements()}
        </div> 
      </div> 
    </div>
  );
};

export default MindMapCanvas;
