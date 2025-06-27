import { useState, useCallback } from 'react';

export const useHistory = (initialState) => {
  const [history, setHistory] = useState([initialState]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const setState = useCallback((action, overwrite = false) => {
    const newState = typeof action === 'function' ? action(history[currentIndex]) : action;
    if (overwrite) {
        const historyCopy = [...history];
        historyCopy[currentIndex] = newState;
        setHistory(historyCopy)
    } else {
        const newHistory = history.slice(0, currentIndex + 1);
        newHistory.push(newState);
        setHistory(newHistory);
        setCurrentIndex(newHistory.length - 1);
    }
  }, [currentIndex, history]);

  const undo = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prevIndex => prevIndex - 1);
    }
  }, [currentIndex]);

  const redo = useCallback(() => {
    if (currentIndex < history.length - 1) {
      setCurrentIndex(prevIndex => prevIndex + 1);
    }
  }, [currentIndex, history.length]);

  return {
    state: history[currentIndex],
    setState,
    undo,
    redo,
    canUndo: currentIndex > 0,
    canRedo: currentIndex < history.length - 1
  };
}; 