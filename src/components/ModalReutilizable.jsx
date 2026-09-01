import React from "react";

import "../styles/ModalReutilizable.css";

const ModalReutilizable = ({
  id,
  title,
  children,
  isOpen,
  onClose,
  onAccept,
  acceptButtonText = "Aceptar",
  className = "",
  hideFooter = false,
  loading = false,
  errorMessage = "",
}) => {
  if (!isOpen) {
    return null;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (
      typeof onAccept === "function" &&
      !loading
    ) {
      await onAccept();
    }
  };

  return (
    <div
      className="modal"
      id={id}
      aria-hidden={!isOpen}
    >
      <div
        className={`modal-card ${className}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${id}-title`}
      >
        <header className="modal-head">
          <h3 id={`${id}-title`}>
            {title}
          </h3>

          <button
            type="button"
            className="icon-btn close-red"
            onClick={onClose}
            aria-label="Cerrar"
            disabled={loading}
          >
            ×
          </button>
        </header>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {errorMessage && (
              <div className="form-error-message">
                {errorMessage}
              </div>
            )}

            {children}
          </div>

          {!hideFooter && (
            <footer className="modal-foot">
              <button
                className="btn btn-primary"
                type="submit"
                disabled={loading}
              >
                {loading
                  ? "Guardando..."
                  : acceptButtonText}
              </button>

              <button
                className="btn btn-secondary"
                type="button"
                onClick={onClose}
                disabled={loading}
              >
                Cancelar
              </button>
            </footer>
          )}
        </form>
      </div>
    </div>
  );
};

export default ModalReutilizable;