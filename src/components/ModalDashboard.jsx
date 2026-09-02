import React from "react";
import "../styles/ModalDashboard.css";
import ModalReutilizable from "./ModalReutilizable";
import TablaReutilizable from "./TablaReutilizable";
import DropdownReutilizable from "./DropdownReutilizable";
import EtiquetaEstado from "./EtiquetaEstado";

class ModalDashboard extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      areaFiltro: "",
      statusFiltro: "",
    };

    this.documentos = [
      {
        area: "Recursos Humanos",
        tipo: "Notificación de trabajos.pdf",
        recepcion: "20-09-2025",
        respuesta: "21-09-2025",
        estatus: "Turnado",
      },
      {
        area: "Contabilidad Técnica",
        tipo: "Solicitud de Viáticos.jpg",
        recepcion: "20-09-2025",
        respuesta: "22-09-2025",
        estatus: "Vencido",
      },
      {
        area: "Presidencia",
        tipo: "Uso de espacio público.pdf",
        recepcion: "22-09-2025",
        respuesta: "25-09-2025",
        estatus: "En proceso",
      },
      {
        area: "Obras Públicas",
        tipo: "Informe de servicios públicos.pdf",
        recepcion: "25-09-2025",
        respuesta: "29-09-2025",
        estatus: "Turnado",
      },
      {
        area: "Ley de Archivo",
        tipo: "Clasificación de expedientes.pdf",
        recepcion: "26-09-2025",
        respuesta: "30-09-2025",
        estatus: "En proceso",
      },
      {
        area: "Turismo",
        tipo: "Proyectos de promoción.pdf",
        recepcion: "26-09-2025",
        respuesta: "29-09-2025",
        estatus: "Vencido",
      },
      {
        area: "Turismo",
        tipo: "Informe Flujo turístico.pdf",
        recepcion: "28-09-2025",
        respuesta: "30-09-2025",
        estatus: "Turnado",
      },
    ];
  }

  getDocumentosFiltrados() {
    const { areaFiltro, statusFiltro } = this.state;

    return this.documentos.filter((doc) => {
      const filtroArea = areaFiltro ? doc.area === areaFiltro : true;
      const filtroStatus = statusFiltro ? doc.estatus === statusFiltro : true;
      return filtroArea && filtroStatus;
    });
  }

  render() {
    const { isOpen, onClose } = this.props;

    const columnas = [
      "Área",
      "Tipo de Documento",
      "Fecha de Recepción",
      "Fecha de Respuesta",
      "Estatus",
    ];

    return (
      <ModalReutilizable
        id="modalDashboard"
        title="Detalles de Documentos"
        isOpen={isOpen}
        onClose={onClose}
        formId="formDetallesDocs"
        className="modal-dashboard-ancho"
        hideFooter={true}
      >
        {/* FILTROS */}
        <div className="filters">
          <DropdownReutilizable
            label="Área"
            value={this.state.areaFiltro}
            onChange={(value) => this.setState({ areaFiltro: value })}
            options={[
              { label: "Todas las áreas", status: "" },
              { label: "Presidencia", status: "Presidencia" },
              { label: "Recursos Humanos", status: "Recursos Humanos" },
              { label: "Contabilidad Técnica", status: "Contabilidad Técnica" },
              { label: "Obras Públicas", status: "Obras Públicas" },
              { label: "Ley de Archivo", status: "Ley de Archivo" },
              { label: "Turismo", status: "Turismo" },
            ]}
          />

          <DropdownReutilizable
            label="Estatus"
            value={this.state.statusFiltro}
            onChange={(value) => this.setState({ statusFiltro: value })}
            options={[
              { label: "Todos los estatus", status: "" },
              { label: "Turnado", status: "Turnado" },
              { label: "En proceso", status: "En proceso" },
              { label: "Vencido", status: "Vencido" },
            ]}
          />
        </div>

        {/* TABLA FILTRADA */}
        <TablaReutilizable
          columns={columnas}
          data={this.getDocumentosFiltrados()}
          renderRow={(row, index) => (
            <tr key={index}>
              <td>{row.area}</td>
              <td>{row.tipo}</td>
              <td>{row.recepcion}</td>
              <td>{row.respuesta}</td>
              <td>
                <EtiquetaEstado estatus={row.estatus} />
              </td>
            </tr>
          )}
        />
      </ModalReutilizable>
    );
  }
}

export default ModalDashboard;
