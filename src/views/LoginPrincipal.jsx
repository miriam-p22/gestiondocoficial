import React, {
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import "../styles/LoginPrincipal.css";

import CampoInicioSesion from "../components/CampoInicioSesion";
import VentanaClaveModal from "../components/VentanaClaveModal";
import RegistroUsuario from "../components/RegistroUsuario";

import FondoInicioSesion from "../assets/fondoInicioSesion.jpg";
import LogoTlahuapan from "../assets/logo_tlahuapan.png";

const API_URL =
  "http://localhost:3001/api/usuarios";

const LoginPrincipal = () => {
  const [
    usuario,
    setUsuario,
  ] = useState("");

  const [
    password,
    setPassword,
  ] = useState("");

  const [
    mantenerSesion,
    setMantenerSesion,
  ] = useState(false);

  const [
    cargandoLogin,
    setCargandoLogin,
  ] = useState(false);

  const [
    errorLogin,
    setErrorLogin,
  ] = useState("");

  // ====================================================
  // CLAVE ESPECIAL RH
  // ====================================================

  const [
    modalClaveOpen,
    setModalClaveOpen,
  ] = useState(false);

  const [
    clave,
    setClave,
  ] = useState("");

  const [
    mensajeClave,
    setMensajeClave,
  ] = useState(null);

  const [
    validandoClave,
    setValidandoClave,
  ] = useState(false);

  const [
    claveValidada,
    setClaveValidada,
  ] = useState("");

  // ====================================================
  // REGISTRO INICIAL RH
  // ====================================================

  const [
    registroVisible,
    setRegistroVisible,
  ] = useState(false);

  const [
    registrandoRh,
    setRegistrandoRh,
  ] = useState(false);

  const [
    errorRegistroRh,
    setErrorRegistroRh,
  ] = useState("");

  const navigate =
    useNavigate();

  // ====================================================
  // ERROR API
  // ====================================================

  const obtenerErrorApi =
    async (response) => {
      try {
        const data =
          await response.json();

        return (
          data?.error ||
          data?.mensaje ||
          `Error HTTP ${response.status}`
        );
      } catch {
        return `Error HTTP ${response.status}`;
      }
    };

  // ====================================================
  // LIMPIAR SESIÓN
  // ====================================================

  const limpiarSesion = () => {
    [
      "token",

      "id_usuario",
      "id_area",
      "id_rol",

      "nombre_usuario",
      "nombre_completo",

      "nombre_area",
      "nombre_rol",

      "mantener_sesion",
    ].forEach(
      (claveStorage) =>
        localStorage.removeItem(
          claveStorage
        )
    );
  };

  // ====================================================
  // GUARDAR SESIÓN
  // ====================================================

  const guardarSesion = (
    usuarioBD,
    token
  ) => {
    limpiarSesion();

    // --------------------------------
    // TOKEN DE AUTENTICACIÓN
    // --------------------------------

    if (token) {
      localStorage.setItem(
        "token",
        token
      );
    }

    // --------------------------------
    // ID USUARIO
    // --------------------------------

    localStorage.setItem(
      "id_usuario",
      String(
        usuarioBD.id
      )
    );

    // --------------------------------
    // ÁREA
    // --------------------------------

    if (
      usuarioBD.id_area !==
        null &&
      usuarioBD.id_area !==
        undefined
    ) {
      localStorage.setItem(
        "id_area",
        String(
          usuarioBD.id_area
        )
      );
    }

    // --------------------------------
    // ROL
    // --------------------------------

    if (
      usuarioBD.id_rol !==
        null &&
      usuarioBD.id_rol !==
        undefined
    ) {
      localStorage.setItem(
        "id_rol",
        String(
          usuarioBD.id_rol
        )
      );
    }

    // --------------------------------
    // DATOS VISUALES
    // --------------------------------

    localStorage.setItem(
      "nombre_usuario",
      usuarioBD.nombre_usuario ||
        ""
    );

    localStorage.setItem(
      "nombre_completo",
      usuarioBD.nombre_completo ||
        ""
    );

    localStorage.setItem(
      "nombre_area",
      usuarioBD.area
        ?.nombre_area ||
        ""
    );

    localStorage.setItem(
      "nombre_rol",
      usuarioBD.rol
        ?.nombre_rol ||
        ""
    );

    // --------------------------------
    // OPCIÓN MANTENER SESIÓN
    // --------------------------------

    localStorage.setItem(
      "mantener_sesion",
      mantenerSesion
        ? "true"
        : "false"
    );
  };

  // ====================================================
  // LOGIN REAL
  // ====================================================

  const onLogin =
    async (event) => {
      event.preventDefault();

      setErrorLogin("");

      if (
        !usuario.trim() ||
        !password
      ) {
        setErrorLogin(
          "Ingrese usuario y contraseña."
        );

        return;
      }

      setCargandoLogin(true);

      try {
        const response =
          await fetch(
            `${API_URL}/login`,
            {
              method:
                "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify({
                  nombre_usuario:
                    usuario.trim(),

                  contrasenia:
                    password,

                  mantener_sesion:
                    mantenerSesion,
                }),
            }
          );

        if (!response.ok) {
          throw new Error(
            await obtenerErrorApi(
              response
            )
          );
        }

        const data =
          await response.json();

        if (!data?.usuario) {
          throw new Error(
            "El servidor no devolvió los datos del usuario."
          );
        }

        guardarSesion(
          data.usuario,
          data.token
        );

        navigate(
          "/Dashboard"
        );
      } catch (error) {
        setErrorLogin(
          error?.message ||
            "No fue posible iniciar sesión."
        );
      } finally {
        setCargandoLogin(false);
      }
    };

  // ====================================================
  // VALIDAR CLAVE RH
  // ====================================================

  const confirmarClave =
    async () => {
      setMensajeClave(null);

      if (
        !clave.trim()
      ) {
        setMensajeClave({
          tipo:
            "error",

          texto:
            "Ingrese la clave especial.",
        });

        return;
      }

      setValidandoClave(true);

      try {
        const response =
          await fetch(
            `${API_URL}/validar-clave-rh`,
            {
              method:
                "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify({
                  clave:
                    clave.trim(),
                }),
            }
          );

        if (!response.ok) {
          throw new Error(
            await obtenerErrorApi(
              response
            )
          );
        }

        setClaveValidada(
          clave.trim()
        );

        setMensajeClave({
          tipo:
            "ok",

          texto:
            "Clave verificada correctamente.",
        });

        setTimeout(
          () => {
            setModalClaveOpen(
              false
            );

            setRegistroVisible(
              true
            );

            setClave("");

            setMensajeClave(
              null
            );

            setErrorRegistroRh(
              ""
            );
          },
          500
        );
      } catch (error) {
        setMensajeClave({
          tipo:
            "error",

          texto:
            error?.message ||
            "La clave especial no es válida.",
        });
      } finally {
        setValidandoClave(false);
      }
    };

  // ====================================================
  // REGISTRO INICIAL RH
  // ====================================================

  const registrarRh =
    async (datos) => {
      setErrorRegistroRh("");

      setRegistrandoRh(true);

      try {
        const response =
          await fetch(
            `${API_URL}/registro-inicial-rh`,
            {
              method:
                "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify({
                  ...datos,

                  clave:
                    claveValidada,
                }),
            }
          );

        if (!response.ok) {
          throw new Error(
            await obtenerErrorApi(
              response
            )
          );
        }

        const data =
          await response.json();

        setRegistroVisible(false);

        setClaveValidada("");

        setUsuario(
          data.usuario
            ?.nombre_usuario ||
            datos.nombre_usuario
        );

        setPassword("");

        setErrorLogin("");

        alert(
          "Registro inicial realizado correctamente. Ya puede iniciar sesión."
        );
      } catch (error) {
        setErrorRegistroRh(
          error?.message ||
            "No fue posible realizar el registro inicial."
        );

        throw error;
      } finally {
        setRegistrandoRh(false);
      }
    };

  return (
    <div
      className="login-principal"
      style={{
        backgroundImage:
          `url(${FondoInicioSesion})`,
      }}
    >
      <div className="login-card">

        {/* ================================================= */}
        {/* LOGO OCULTO RH */}
        {/* ================================================= */}

        <div
          className="logo-button"
          onClick={() => {
            setModalClaveOpen(
              true
            );

            setMensajeClave(
              null
            );

            setClave("");
          }}
        >
          <img
            src={
              LogoTlahuapan
            }
            alt="Logo Tlahuapan"
            className="logo"
          />
        </div>

        {/* ================================================= */}
        {/* LOGIN */}
        {/* ================================================= */}

        <form
          onSubmit={
            onLogin
          }
        >
          <CampoInicioSesion
            type="text"
            value={
              usuario
            }
            onChange={(
              event
            ) =>
              setUsuario(
                event.target.value
              )
            }
            placeholder="Usuario"
          />

          <CampoInicioSesion
            type="password"
            value={
              password
            }
            onChange={(
              event
            ) =>
              setPassword(
                event.target.value
              )
            }
            placeholder="Contraseña"
          />

          {errorLogin && (
            <div className="login-error">
              {
                errorLogin
              }
            </div>
          )}

          <button
            className="btn-login"
            type="submit"
            disabled={
              cargandoLogin
            }
          >
            {cargandoLogin
              ? "INICIANDO..."
              : "INICIAR SESIÓN"}
          </button>

          <div className="checkbox-container">
            <input
              type="checkbox"
              checked={
                mantenerSesion
              }
              onChange={() =>
                setMantenerSesion(
                  !mantenerSesion
                )
              }
            />

            <label>
              Mantener sesión iniciada
            </label>
          </div>
        </form>

      </div>

      {/* ================================================= */}
      {/* CLAVE ESPECIAL */}
      {/* ================================================= */}

      <VentanaClaveModal
        isOpen={
          modalClaveOpen
        }
        onClose={() => {
          setModalClaveOpen(false);
          setMensajeClave(null);
          setClave("");
        }}
        clave={
          clave
        }
        setClave={
          setClave
        }
        onConfirm={
          confirmarClave
        }
        mensaje={
          mensajeClave
        }
        loading={
          validandoClave
        }
      />

      {/* ================================================= */}
      {/* REGISTRO INICIAL */}
      {/* ================================================= */}

      <RegistroUsuario
        isOpen={
          registroVisible
        }
        loading={
          registrandoRh
        }
        errorMessage={
          errorRegistroRh
        }
        onClose={() => {
          setRegistroVisible(false);
          setClaveValidada("");
          setErrorRegistroRh("");
        }}
        onRegister={
          registrarRh
        }
      />
    </div>
  );
};

export default LoginPrincipal;