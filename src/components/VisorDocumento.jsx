import React from "react";

import "../styles/VisorDocumento.css";

const VisorDocumento = ({ documentUrl, documentTitle }) => {
  if (!documentUrl) {
    return (
      <div className="visor-documento-container">
        <p>No hay un archivo disponible para visualizar.</p>
      </div>
    );
  }

  return (
    <div className="visor-documento-container">
      {documentTitle && (
        <h3 className="visor-documento-titulo">{documentTitle}</h3>
      )}

      <div className="visor-documento-embed">
        <object
          data={documentUrl}
          type="application/pdf"
          width="100%"
          height="500px"
        >
          <p>
            No se pudo mostrar el documento.{" "}
            <a href={documentUrl} target="_blank" rel="noopener noreferrer">
              Abrir en otra ventana
            </a>
          </p>
        </object>
      </div>
    </div>
  );
};

export default VisorDocumento;
