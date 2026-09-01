import React from "react";
import {
  BrowserRouter as Router,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import LoginPrincipal from "./views/LoginPrincipal";
import Layout from "./components/Layout";
import Usuarios from "./views/Usuarios";
import Dashboard from "./views/Dashboard";
import Dispersion from "./views/Dispersion";
import Organigrama from "./views/Organigrama";
import Documentos from "./views/Documentos";
import LeyArchivo from "./views/LeyArchivo";
import NotificacionConexionBD from "./views/NotificacionConexionBD";
import DireccionesIp from "./views/DireccionesIP";
import AreasPage from "./views/AreasPage";

import "./App.css";

const RutaAutenticada = ({ children }) => {
  const token = String(localStorage.getItem("token") || "").trim();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPrincipal />} />
        <Route index element={<Navigate to="/login" replace />} />

        <Route
          path="/"
          element={
            <RutaAutenticada>
              <Layout />
            </RutaAutenticada>
          }
        >
          <Route path="Usuarios" element={<Usuarios />} />
          <Route path="Dashboard" element={<Dashboard />} />
          <Route path="Dispersion" element={<Dispersion />} />
          <Route path="organigrama" element={<Organigrama />} />
          <Route path="Documentos" element={<Documentos />} />
          <Route path="LeyArchivo" element={<LeyArchivo />} />
          <Route path="Areas" element={<AreasPage />} />
          <Route
            path="config/notificacion-conexion"
            element={<NotificacionConexionBD />}
          />
          <Route
            path="config/direcciones-ip"
            element={<DireccionesIp />}
          />
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;