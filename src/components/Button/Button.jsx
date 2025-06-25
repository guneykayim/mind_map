import React from 'react';
import styles from './Button.module.css';

const Button = ({ onClick, icon, children }) => {
  return (
    <button className={styles.button} onClick={onClick}>
      {icon}
      {children}
    </button>
  );
};

export default Button; 