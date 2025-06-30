import React from 'react';
import styles from './Arrow.module.css';

// Component to render an arrow between two points
const Arrow = ({ from, to }) => {
  // Calculate the angle of the line
  const angle = Math.atan2(to.y - from.y, to.x - from.x);
  const headLength = 10; // Length of the arrow head
  
  // Use the exact 'to' point as the end of the line
  // The App component is already calculating the exact edge points
  const endX = to.x;
  const endY = to.y;
  
  // Calculate the points for the arrow head
  // Position the arrow head slightly inside the line for better visual
  const arrowBaseX = endX - Math.cos(angle) * headLength * 0.5;
  const arrowBaseY = endY - Math.sin(angle) * headLength * 0.5;
  
  const x1 = arrowBaseX - headLength * Math.cos(angle - Math.PI / 6);
  const y1 = arrowBaseY - headLength * Math.sin(angle - Math.PI / 6);
  const x2 = arrowBaseX - headLength * Math.cos(angle + Math.PI / 6);
  const y2 = arrowBaseY - headLength * Math.sin(angle + Math.PI / 6);

  return (
    <g>
      <line
        x1={from.x}
        y1={from.y}
        x2={endX}
        y2={endY}
        className={styles.arrowLine}
      />
      <line
        x1={endX}
        y1={endY}
        x2={x1}
        y2={y1}
        className={styles.arrowLine}
      />
      <line
        x1={endX}
        y1={endY}
        x2={x2}
        y2={y2}
        className={styles.arrowLine}
      />
    </g>
  );
};

export default Arrow;
