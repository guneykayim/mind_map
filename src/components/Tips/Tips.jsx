import React from 'react';
import styles from './Tips.module.css';

const Key = ({ children }) => <span className={styles.key}>{children}</span>;

const Tips = () => {
  return (
    <div className={styles.tipsContainer}>
      <div className={styles.tipsTitle}>💡 Quick Tips</div>
      <ul className={styles.tipsList}>
        <li className={styles.tipItem}>
          <strong>Multi-select:</strong>&nbsp;
          <span><Key>Shift</Key> + Click or draw a rectangle</span>
        </li>
        <li className={styles.tipItem}>
          <strong>Pan Canvas:</strong> <Key>Shift</Key> + Drag
        </li>
        <li className={styles.tipItem}>
          <strong>Zoom:</strong> <Key>Ctrl</Key> + Scroll
        </li>
      </ul>
    </div>
  );
};

export default Tips; 