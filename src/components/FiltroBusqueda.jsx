// src/components/SearchBar.jsx
import React from "react";
import '../styles/FiltroBusqueda.css';

const FiltroBusqueda = ({ value, onChange, placeholder = "Buscar..." }) => {
    return (
        <div className="search-container">
            <i className="fa-solid fa-magnifying-glass search-icon"></i>

            <input
                type="text"
                className="search-input"
                value={value}
                onChange={onChange}
                placeholder={placeholder}
            />
        </div>
    );
};

export default FiltroBusqueda;
