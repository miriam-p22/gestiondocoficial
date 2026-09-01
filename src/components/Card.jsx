import React from 'react';
import '../styles/Card.css';

const Card = ({ title, children, className = '' }) => {
  return (
    <div className={`content-section ${className}`}>
      {title && <h2 className="card-title">{title}</h2>}
      {children}
    </div>
  );
};

export default Card;