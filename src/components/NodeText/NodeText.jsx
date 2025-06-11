import React from 'react';
import styles from './NodeText.module.css';

const NodeText = ({ text, onTextChange, isEditing, setIsEditing, onStartEditing }) => {
  const handleBlur = (e) => {
    setIsEditing(false);
    onTextChange(e.target.value);
  };

  const handleChange = (e) => {
    onTextChange(e.target.value);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      setIsEditing(false);
      onTextChange(e.target.value);
    }
  };

  const handleMouseDown = (e) => {
    e.stopPropagation();
  };

  return isEditing ? (
    <input
      type="text"
      value={text}
      onBlur={handleBlur}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      autoFocus
      className={styles.input}
    />
  ) : (
    <span 
      className={styles.text}
      onDoubleClick={(e) => {
        e.stopPropagation();
        onStartEditing();
      }}
      onMouseDown={handleMouseDown}
    >
      {text}
    </span>
  );
};

export default NodeText;
