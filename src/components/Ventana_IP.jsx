import React, { useState } from "react";

import "../styles/VentanaClaveIP.css"; 

const Ventana_IP = ({ onIpConfirmada }) => {
    const [ip, setIp] = useState('');

    const handleConfirmar = () => {
        // Validación  de IP 
        const ipRegex = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;
        
        if (ipRegex.test(ip)) {
            onIpConfirmada(ip); // Se llama a la función del padre para guardar la IP
        } else {
            alert('Por favor, introduce una dirección IP válida (ej: 192.168.1.1).');
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h2>Configuración Inicial de Red</h2>
                <p>Para conectar con el servidor de RH. Introduce la IP de la computadora de control. Esto solo se pedirá una vez.</p>
                <input
                    type="text" 
                    className="modal-input"
                    value={ip}
                    onChange={(e) => setIp(e.target.value)}
                    placeholder="Ej: 192.168.1.100"
                    autoFocus
                />
                <div className="modal-buttons">
                    <button className="modal-btn confirmar" onClick={handleConfirmar}>
                        Guardar IP
                    </button>
                </div>
                {/* No hay botón de Cancelar, ya que la IP es obligatoria para el primer inicio */}
            </div>
        </div>
    );
};

export default Ventana_IP;