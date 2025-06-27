import React from 'react';
import styles from './ConfirmationDialog.module.css';
import Button from '../Button';

const ConfirmationDialog = ({ isOpen, onClose, onConfirm, title, message }) => {
  if (!isOpen) {
    return null;
  }

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.dialog} onClick={(e) => e.stopPropagation()}>
        <h3 className={styles.title}>{title}</h3>
        <p className={styles.message}>{message}</p>
        <div className={styles.actions}>
          <Button onClick={onClose} variant="secondary">Cancel</Button>
          <Button onClick={handleConfirm} variant="primary">Confirm</Button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationDialog; 