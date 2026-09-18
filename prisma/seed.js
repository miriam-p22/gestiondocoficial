const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const AREAS_BASE = ["Dirección de Recursos Humanos"];

const ROLES_BASE = [
  "Administrador",
  "Recursos Humanos",
  "Capturista",
  "Usuario",
  "Jefe de Area",
  "Responsable de Archivo",
  "Oficialía de Partes",
  "Presidencia",
  "Ninguno",
];

const PRIVILEGIOS_BASE = [
  "Registrar usuarios",
  "Gestionar Áreas",
  "Gestionar Direcciones IP",
  "Gestionar Notificaciones",
  "Gestionar Configuración del Sistema",
  "Gestionar Roles y Privilegios",
  "Gestionar Archivo Físico",
  "Consultar Archivo Físico Global",
  "Consultar Documentos Global",
  "Generar Respaldos",
  "Gestionar Dispersión",
  "Gestionar Organigrama",
  "Revisar Organigrama",
];

const PERMISOS_BASE = {
  Administrador: [
    "Gestionar Áreas",
    "Gestionar Direcciones IP",
    "Gestionar Notificaciones",
    "Gestionar Configuración del Sistema",
    "Gestionar Roles y Privilegios",
    "Consultar Archivo Físico Global",
    "Consultar Documentos Global",
    "Generar Respaldos",
  ],
  "Recursos Humanos": [
    "Registrar usuarios",
    "Gestionar Áreas",
    "Gestionar Direcciones IP",
    "Gestionar Organigrama",
    "Gestionar Roles y Privilegios",
  ],
  "Oficialía de Partes": ["Gestionar Dispersión"],
  Presidencia: ["Revisar Organigrama", "Consultar Documentos Global"],
  "Responsable de Archivo": [
    "Gestionar Archivo Físico",
    "Consultar Archivo Físico Global",
  ],
  Capturista: [],
  Usuario: [],
  "Jefe de Area": [],
  Ninguno: [],
};

const CLAVE_RH_INICIAL_HASH =
  "$2y$12$OWXmUOZE9QxtelE587cnhufVmFRn2oZMGcNxRkJIxHBkz3QTcws8C";

const crearAreasBase = async () => {
  console.log("Verificando áreas base...");
  for (const nombreArea of AREAS_BASE) {
    await prisma.area.upsert({
      where: { nombre_area: nombreArea },
      update: {},
      create: { nombre_area: nombreArea },
    });
  }
  console.log("Áreas base verificadas.");
};

const crearRolesBase = async () => {
  console.log("Verificando roles base...");
  for (const nombreRol of ROLES_BASE) {
    await prisma.rol.upsert({
      where: { nombre_rol: nombreRol },
      update: {},
      create: { nombre_rol: nombreRol },
    });
  }
  console.log("Roles base verificados.");
};

const crearPrivilegiosBase = async () => {
  console.log("Verificando privilegios base...");
  for (const tituloPrivilegio of PRIVILEGIOS_BASE) {
    await prisma.privilegio.upsert({
      where: { titulo_privilegio: tituloPrivilegio },
      update: {},
      create: { titulo_privilegio: tituloPrivilegio },
    });
  }
  console.log("Privilegios base verificados.");
};

const asignarPermisosBase = async () => {
  console.log("Verificando permisos base...");
  for (const [nombreRol, privilegios] of Object.entries(PERMISOS_BASE)) {
    const rol = await prisma.rol.findUnique({
      where: { nombre_rol: nombreRol },
    });

    if (!rol) {
      throw new Error(`No se encontró el rol base: ${nombreRol}`);
    }

    for (const tituloPrivilegio of privilegios) {
      const privilegio = await prisma.privilegio.findUnique({
        where: { titulo_privilegio: tituloPrivilegio },
      });

      if (!privilegio) {
        throw new Error(
          `No se encontró el privilegio base: ${tituloPrivilegio}`,
        );
      }

      await prisma.rolPermiso.upsert({
        where: {
          id_rol_id_privilegio: {
            id_rol: rol.id,
            id_privilegio: privilegio.id,
          },
        },
        update: {},
        create: {
          id_rol: rol.id,
          id_privilegio: privilegio.id,
        },
      });
    }
  }
  console.log("Permisos base verificados.");
};

const crearClaveRhInicial = async () => {
  console.log("Verificando clave inicial de RH...");
  const clavesExistentes = await prisma.claveRh.count();

  if (clavesExistentes === 0) {
    await prisma.claveRh.create({
      data: { clave: CLAVE_RH_INICIAL_HASH },
    });
    console.log("Clave inicial de RH creada.");
    return;
  }

  console.log(
    "La tabla claverh ya contiene al menos una clave; no se agregó otra.",
  );
};

const mostrarResumen = async () => {
  const roles = await prisma.rol.findMany({
    where: { nombre_rol: { in: ROLES_BASE } },
    include: {
      permisos: {
        include: { privilegio: true },
      },
    },
    orderBy: { nombre_rol: "asc" },
  });

  const totalClavesRh = await prisma.claveRh.count();

  console.log("");
  console.log(" RESUMEN DE CONFIGURACIÓN BASE");

  for (const rol of roles) {
    console.log("");
    console.log(`Rol: ${rol.nombre_rol}`);

    if (rol.permisos.length === 0) {
      console.log("  - Sin privilegios administrativos globales.");
      continue;
    }

    for (const permiso of rol.permisos) {
      console.log(`  - ${permiso.privilegio.titulo_privilegio}`);
    }
  }

  console.log("");
  console.log(`Claves RH registradas: ${totalClavesRh}`);
  console.log("");
};

async function main() {
  console.log("");
  console.log("Iniciando seed base del sistema...");
  console.log("");

  await crearAreasBase();
  await crearRolesBase();
  await crearPrivilegiosBase();
  await asignarPermisosBase();
  await crearClaveRhInicial();
  await mostrarResumen();

  console.log("Seed ejecutado correctamente.");
  console.log("");
}

main()
  .catch((error) => {
    console.error("");
    console.error("Error inesperado en el seed:");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
