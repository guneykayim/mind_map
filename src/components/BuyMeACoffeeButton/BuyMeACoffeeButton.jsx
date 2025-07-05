import React from 'react';
import styles from './BuyMeACoffeeButton.module.css';

function BuyMeACoffeeButton() {
  return (
    <a 
      className={styles.button}
      target="_blank" 
      rel="noopener noreferrer"
      href="https://www.buymeacoffee.com/guneykayim"
    >
      <img 
        className={styles.image} 
        src="https://www.buymeacoffee.com/assets/img/guidelines/logo-mark-3.svg" 
        alt="Buy me a coffee" 
      />
      <span className={styles.text}>Buy us a coffee</span>
    </a>
  );
}

export default BuyMeACoffeeButton; 