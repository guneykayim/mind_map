import html2canvas from 'html2canvas';
import { findNodeById } from './nodeTreeUtils';

// Function to convert an SVG element to a Data URI
const svgToDataUri = (svg) => {
  const svgString = new XMLSerializer().serializeToString(svg);
  return `data:image/svg+xml;base64,${btoa(svgString)}`;
};

// Function to create an image element from an SVG
const createSvgImage = (svg) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.src = svgToDataUri(svg);
  });
};

// Main export function
export const exportAsPng = async (canvasContentRef, nodes, arrowData, nodeRefs) => {
  const canvasElement = canvasContentRef.current;
  if (!canvasElement) return;

  // --- Calculate the bounding box of all nodes and arrows ---
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  if (nodeRefs && Object.keys(nodeRefs).length > 0) {
    for (const nodeId in nodeRefs) {
      const nodeElement = nodeRefs[nodeId];
      const node = findNodeById(nodes, nodeId);

      if (nodeElement && node) {
        const { x, y } = node;
        const width = nodeElement.offsetWidth;
        const height = nodeElement.offsetHeight;
        
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x + width);
        maxY = Math.max(maxY, y + height);
      }
    }

    arrowData.forEach(arrow => {
      minX = Math.min(minX, arrow.from.x, arrow.to.x);
      minY = Math.min(minY, arrow.from.y, arrow.to.y);
      maxX = Math.max(maxX, arrow.from.x, arrow.to.x);
      maxY = Math.max(maxY, arrow.from.y, arrow.to.y);
    });

    const padding = 50;
    minX -= padding;
    minY -= padding;
    maxX += padding;
    maxY += padding;
  }

  const captureOptions = {
    useCORS: true,
    allowTaint: true,
    backgroundColor: '#ffffff',
  };

  if (isFinite(minX)) {
    captureOptions.x = minX;
    captureOptions.y = minY;
    captureOptions.width = maxX - minX;
    captureOptions.height = maxY - minY;
  }
  
  // --- Temporarily add arrows as images for capture ---
  const arrowElements = [];

  for (const arrow of arrowData) {
    // This is a simplified arrow rendering. 
    // We'll need to adjust this based on the actual Arrow component.
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    svg.style.position = 'absolute';
    svg.style.left = 0;
    svg.style.top = 0;
    
    // Create a group for the arrow parts
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', arrow.from.x);
    line.setAttribute('y1', arrow.from.y);
    line.setAttribute('x2', arrow.to.x);
    line.setAttribute('y2', arrow.to.y);
    line.setAttribute('stroke', 'black');
    line.setAttribute('stroke-width', '2');
    
    g.appendChild(line);
    
    // Arrowhead
    const angle = Math.atan2(arrow.to.y - arrow.from.y, arrow.to.x - arrow.from.x);
    const headLength = 10;
    
    const x1 = arrow.to.x - headLength * Math.cos(angle - Math.PI / 6);
    const y1 = arrow.to.y - headLength * Math.sin(angle - Math.PI / 6);
    const x2 = arrow.to.x - headLength * Math.cos(angle + Math.PI / 6);
    const y2 = arrow.to.y - headLength * Math.sin(angle + Math.PI / 6);

    const headLine1 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    headLine1.setAttribute('x1', arrow.to.x);
    headLine1.setAttribute('y1', arrow.to.y);
    headLine1.setAttribute('x2', x1);
    headLine1.setAttribute('y2', y1);
    headLine1.setAttribute('stroke', 'black');
    headLine1.setAttribute('stroke-width', '2');
    
    const headLine2 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    headLine2.setAttribute('x1', arrow.to.x);
    headLine2.setAttribute('y1', arrow.to.y);
    headLine2.setAttribute('x2', x2);
    headLine2.setAttribute('y2', y2);
    headLine2.setAttribute('stroke', 'black');
    headLine2.setAttribute('stroke-width', '2');
    
    g.appendChild(headLine1);
    g.appendChild(headLine2);
    
    svg.appendChild(g);

    try {
      const img = await createSvgImage(svg);
      img.style.position = 'absolute';
      img.style.left = `0px`;
      img.style.top = `0px`;
      img.style.width = '100%';
      img.style.height = '100%';
      img.style.pointerEvents = 'none';

      canvasElement.appendChild(img);
      arrowElements.push(img);

    } catch(err) {
      console.error('Failed to create SVG image', err);
    }
  }

  try {
    const canvas = await html2canvas(canvasElement, captureOptions);
    const dataUrl = canvas.toDataURL('image/png');
    if (window.showSaveFilePicker) {
      try {
        const options = {
          suggestedName: 'mind-map.png',
          types: [
            {
              description: 'PNG Image',
              accept: { 'image/png': ['.png'] },
            },
          ],
        };
        const handle = await window.showSaveFilePicker(options);
        const writable = await handle.createWritable();
        // Convert dataURL to Blob
        const res = await fetch(dataUrl);
        const blob = await res.blob();
        await writable.write(blob);
        await writable.close();
      } catch (err) {
        if (err.name === 'AbortError') {
          // User cancelled the save dialog
          console.log('Save operation was cancelled.');
        } else {
          console.error('Error saving the PNG file:', err);
        }
      }
    } else {
      // Fallback for browsers that do not support the API
      const link = document.createElement('a');
      link.download = 'mind-map.png';
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  } catch(err) {
    console.error('Error exporting PNG:', err);
  } finally {
    // Clean up temporary arrow images
    arrowElements.forEach(el => el.remove());
  }
}; 