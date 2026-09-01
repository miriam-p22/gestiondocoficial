import React from "react";

const ErrorModal = ({ mensaje, onClose }) => {
  if (!mensaje) return null;

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.icon}>❌</div>

        <h3>Error</h3>
        <p>{mensaje}</p>

        <button onClick={onClose} style={styles.button}>
          Cerrar
        </button>
      </div>
    </div>
  );
};

const styles = {
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    backgroundColor: "rgba(0,0,0,0.4)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  modal: {
    backgroundColor: "#fff",
    padding: "2rem",
    borderRadius: "8px",
    width: "320px",
    textAlign: "center",
    boxShadow: "0 5px 15px rgba(0,0,0,0.3)",
  },
  icon: {
    fontSize: "3rem",
    marginBottom: "0.5rem",
  },
  button: {
    marginTop: "1rem",
    padding: "0.5rem 1.2rem",
    border: "none",
    borderRadius: "4px",
    backgroundColor: "#d32f2f",
    color: "#fff",
    cursor: "pointer",
  },
};

export default ErrorModal;
