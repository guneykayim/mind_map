import html2canvas from 'html2canvas';

// Main export function
export const exportAsPng = async (canvasContentRef, nodes, arrowData, nodeRefs) => {
  const canvasElement = canvasContentRef.current;
  if (!canvasElement) return;

  // 1. Calculate bounding box using DOM positions for nodes
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  const containerRect = canvasElement.getBoundingClientRect();
  // Nodes: use DOM positions
  Object.values(nodeRefs || {}).forEach(nodeEl => {
    if (nodeEl && nodeEl.getBoundingClientRect) {
      const rect = nodeEl.getBoundingClientRect();
      const left = rect.left - containerRect.left;
      const top = rect.top - containerRect.top;
      const right = rect.right - containerRect.left;
      const bottom = rect.bottom - containerRect.top;
      minX = Math.min(minX, left);
      minY = Math.min(minY, top);
      maxX = Math.max(maxX, right);
      maxY = Math.max(maxY, bottom);
    }
  });
  if (!isFinite(minX) || !isFinite(minY) || !isFinite(maxX) || !isFinite(maxY)) {
    minX = minY = 0; maxX = maxY = 1000;
  }
  // Add a small fixed margin for comfort
  const margin = 32;
  minX -= margin;
  minY -= margin;
  maxX += margin;
  maxY += margin;
  const exportWidth = Math.ceil(maxX - minX);
  const exportHeight = Math.ceil(maxY - minY);

  // 2. Create a temporary wrapper div to offset all content to (0,0)
  const wrapper = document.createElement('div');
  wrapper.style.position = 'relative';
  wrapper.style.width = exportWidth + 'px';
  wrapper.style.height = exportHeight + 'px';
  wrapper.style.overflow = 'visible';
  wrapper.style.background = '#fff';

  // Move all children of canvasElement into wrapper, and offset them
  const children = Array.from(canvasElement.childNodes);
  children.forEach(child => {
    if (child.nodeType === 1) {
      const el = child;
      // Save original transform and position
      el._originalTransform = el.style.transform;
      el._originalLeft = el.style.left;
      el._originalTop = el.style.top;
      // Offset by -minX, -minY
      el.style.transform = `translate(${-minX}px, ${-minY}px)` + (el.style.transform ? ' ' + el.style.transform : '');
    }
    wrapper.appendChild(child);
  });
  canvasElement.appendChild(wrapper);

  // 3. Use html2canvas to capture the full area
  const captureOptions = {
    useCORS: true,
    allowTaint: true,
    backgroundColor: '#ffffff',
    width: exportWidth,
    height: exportHeight,
    x: 0,
    y: 0,
    scrollX: 0,
    scrollY: 0,
    windowWidth: exportWidth,
    windowHeight: exportHeight,
  };

  try {
    const canvas = await html2canvas(wrapper, captureOptions);
    const dataUrl = canvas.toDataURL('image/png');

    // 4. Restore original DOM structure and styles
    children.forEach(child => {
      if (child.nodeType === 1) {
        const el = child;
        el.style.transform = el._originalTransform || '';
        el.style.left = el._originalLeft || '';
        el.style.top = el._originalTop || '';
        delete el._originalTransform;
        delete el._originalLeft;
        delete el._originalTop;
      }
      canvasElement.appendChild(child);
    });
    if (wrapper.parentNode) wrapper.parentNode.removeChild(wrapper);

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
  }
};