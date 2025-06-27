import React from 'react';
import styles from './Button.module.css';

const Button = ({ onClick, children, icon, variant = 'default' }) => {
  return (
    <button className={`${styles.button} ${styles[variant]}`} onClick={onClick}>
      {icon && <span className={styles.icon}>{icon}</span>}
      {children}
    </button>
  );
};

export default Button; 