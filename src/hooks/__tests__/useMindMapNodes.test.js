import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMindMapNodes } from '../useMindMapNodes';

describe('useMindMapNodes serialization and deserialization', () => {
    it('should serialize the nodes and then deserialize back to the original state', () => {
        const { result } = renderHook(() => useMindMapNodes());

        // 1. Get initial nodes and serialize them
        const initialNodes = result.current.nodes;
        const serializedNodes = result.current.serialize();

        // 2. Modify the nodes by adding a new one
        act(() => {
            result.current.addNode('root', 'right');
        });
        
        // Ensure the node was actually added
        expect(result.current.nodes[0].children.length).toBe(1);
        
        // 3. Deserialize the original data
        act(() => {
            result.current.deserialize(serializedNodes);
        });

        // 4. Assert that the nodes are back to the initial state
        expect(result.current.nodes).toEqual(initialNodes);
    });

    it('should correctly serialize a complex node tree and deserialize it back', () => {
        const { result } = renderHook(() => useMindMapNodes());

        // 1. Create a more complex node structure
        act(() => {
            result.current.addNode('root', 'right');
        });
        act(() => {
            result.current.addNode('root', 'left');
        });
        
        const rightChildId = result.current.nodes[0].children[0].id;
        act(() => {
            result.current.addNode(rightChildId, 'right');
        });

        // 2. Capture the complex state and serialize it
        const complexState = JSON.parse(JSON.stringify(result.current.nodes)); // Deep copy
        const serializedComplexState = result.current.serialize();

        // 3. Modify the state *after* serialization to ensure deserialization is working
        act(() => {
            result.current.addNode('root', 'right');
        });

        // Verify the state has indeed changed
        expect(result.current.nodes[0].children.length).toBe(3);

        // 4. Deserialize the saved complex state
        act(() => {
            result.current.deserialize(serializedComplexState);
        });

        // 5. Assert that the state has been restored to the captured complex state
        expect(result.current.nodes).toEqual(complexState);
        expect(result.current.nodes[0].children.length).toBe(2);
    });

    it('should serialize a node structure and confirm its shape', () => {
        const { result } = renderHook(() => useMindMapNodes());

        // Create a known structure
        act(() => {
            result.current.addNode('root', 'right');
            result.current.addNode('root', 'left');
        });

        const serializedData = result.current.serialize();
        const parsedData = JSON.parse(serializedData);

        // Assert the structure is correct
        expect(parsedData).toBeInstanceOf(Array);
        expect(parsedData.length).toBe(1);
        expect(parsedData[0].id).toBe('root');
        expect(parsedData[0].children.length).toBe(2);
        expect(parsedData[0].children[0].side).toBe('right');
        expect(parsedData[0].children[1].side).toBe('left');
    });

    it('should deserialize a JSON string and update the nodes state correctly', () => {
        const { result } = renderHook(() => useMindMapNodes());

        const jsonString = `
        [
          {
            "id": "root",
            "text": "Start Here",
            "x": 665,
            "y": 368,
            "children": [
              {
                "id": "h2rt6r3pp",
                "text": "New Node",
                "children": [],
                "x": 895,
                "y": 368,
                "side": "right"
              },
              {
                "id": "y3qmwj2ab",
                "text": "New Node",
                "children": [],
                "x": 435,
                "y": 368,
                "side": "left"
              }
            ]
          }
        ]`;

        const expectedNodes = JSON.parse(jsonString);

        act(() => {
            result.current.deserialize(jsonString);
        });

        expect(result.current.nodes).toEqual(expectedNodes);
        // Also check a specific property for good measure
        expect(result.current.nodes[0].children.length).toBe(2);
    });
});

describe('useMindMapNodes manipulation', () => {
    it('should clear the canvas, leaving only the root node', () => {
        const { result } = renderHook(() => useMindMapNodes());

        // 1. Add some nodes to make the state non-initial
        act(() => {
            result.current.addNode('root', 'right');
            result.current.addNode('root', 'left');
        });

        // Verify nodes were added
        expect(result.current.nodes[0].children.length).toBe(2);

        // 2. Call clearCanvas
        act(() => {
            result.current.clearCanvas();
        });

        // 3. Assert that only the root node remains and it has no children
        expect(result.current.nodes.length).toBe(1);
        expect(result.current.nodes[0].id).toBe('root');
        expect(result.current.nodes[0].children.length).toBe(0);
    });
}); 