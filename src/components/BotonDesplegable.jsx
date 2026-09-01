import React, { useState } from 'react';
import { FaChevronDown } from "react-icons/fa";
import '../styles/BotonDesplegable.css';

const BotonDesplegable = ({ title = "Opciones", options = [] }) => {
  const [open, setOpen] = useState(false);

  const handleToggleClick = (e) => {
    e.stopPropagation(); 
    setOpen(!open);
  };
  
  const handleOptionClick = (e, opt) => {
    e.stopPropagation(); 
    setOpen(false);
    opt.onClick(e); 
  }

  return (
    <div className="dropdown-action">
      <button
        className="dropdown-toggle-status"
        onClick={handleToggleClick}
      >
        {title} <FaChevronDown />
      </button>

      {open && (
        <div className="dropdown-content">
          {options.map((opt, index) => (
            <button
              key={index}
              className={`btn-action status-action ${opt.statusClass || ''}`} 
              onClick={(e) => handleOptionClick(e, opt)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default BotonDesplegable;