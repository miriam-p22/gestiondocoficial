# Guía para Configurar el Proyecto "Gestión Documental" en Windows

Guía paso a paso para clonar y configurar el proyecto de Gestión Documental, esto en equipos de cómputo con Windows, asegurando que las versiones de Node y las dependencias sean consistentes. Además, se incluye los pasos para preparar la base de datos y ejecutar las migraciones de Prisma.

---

## 1️⃣ Instalación de NVM (Node Version Manager) en Windows

NVM permite instalar y cambiar fácilmente entre diferentes versiones de Node.js. La versión que se utilizará será la 20, esto permite descargar las dependencias adecuadas para el proyecto.

1. Descarga el instalador de [nvm-windows](https://github.com/coreybutler/nvm-windows/releases/download/1.2.2/nvm-setup.exe) (`nvm-setup.exe`).
2. Ejecuta el instalador y sigue el asistente sin cambiar seleccionar alguna opción.
3. Abre una terminal (CMD o PowerShell) y verificar la instalación ejecutando el siguiente comando:

```bash
nvm version
```

deberá mostrar algo asi

```bash
1.2.2
```

Ahora para conocer la o las versiones de Node que tienes instaladas, deberás ejecutar el siguiente comando:

```bash
nvm list
```

mostrará algo similar a esto:

```bash
  22.13.1
* 20.19.6 (Currently using 64-bit executable)
  18.8.0
```

Ahora instala la versión 20 de Node, utilizando el siguiente comando:

```bash
nvm install 20
```

Asegurate de usar la versión 20 en la terminal actual

```bash
nvm use 20
```

Ahora verifica nuevamente la lista de versiones de Node que tienes instaladas. Debes tener seleccionada la versión 20:

```bash
nvm list
```

```bash
  22.13.1
* 20.19.6 (Currently using 64-bit executable)
  18.8.0
```

### Nota

`Al instalar la versión 20 de Node, incluye el uso de de los comandos npm y npx, son comandos necesarios para la gestión de paquetes`

---

## 2️⃣ Instalación y configuración de npm compatible con Node

Es importante aclarar que algunas versiones de npm (como la 11.x o superior) pueden generar problemas de compatibilidad con ciertas dependencias con proyectos generados con Node 20.x.

Primero debes conocer la versión de npm que tienes instalado en tu computadora, ejecutando el siguiente comando:

```bash
npm -v
```

Si se muestra una versión superior a la 10.x, entonces deberás instalar y seleccionar la versión 10.x, ya que es compatible con la versión 20 de Node, ejecutando el siguiente comando, en la terminal.

```bash
npm install -g npm@10
```

Ahora, nuevamente ejecuta el siguiente comando:

```bash
npm -v
```

Deberá mostrar la siguiente versión o similar. Lo importante es que sea 10.x.x

```bash
10.9.4
```

Listo, ahora tenemos Node 20.x y npm 10.x

---

## 3️⃣ Clonación del proyecto

Esta clonación es un paso habitual y sin complicaciones. Ubica una carpeta en Mis Documentos o en alguna partición que tengas disponible en tu computadora y genera una carpeta con el nombre **Residencias** ingresa a dicha carpeta y abre una terminal.

```
🖥️Este equipo
└── 📁 Documentos
    └── 📁 Residencias

```

En la terminal, solo hay que ejecutar el siguiente comando:

```bash
git clone https://github.com/tomas1707/gestiondocumental.git
```

Ahora, utilizando la terminal, deberás ingresar a la subcarpeta gestiondocumental (producto de la clonación) y ejecutas code . para abrir Visual Studio Code y al mismo tiempo el proyecto clonado de react:

```
🖥️Este equipo
└── 📁 Documentos
    └── 📁 Residencias
        └── 📁 gestiondocumental

```

```bash
C:\Users\denisse\Documents\residencias\gestiondocumental> code .
```

---

## 4️⃣ Instalar dependencias

Una vez clonado el proyecto, es momento de instalar las dependencias necesarias para que se pueda ejecutar, para esto será necesario que ejecutes un comando clave.

Instala las dependencias (usando legacy-peer-deps para evitar conflictos de versiones)

```bash
npm install --legacy-peer-deps
```

---

## 5️⃣ Configuración de la Base de Datos (MySQL)

Es necesario crear la base de datos y el usuario con los permisos que requiere Prisma. Utiliza tu cliente de mysql que ofrece laragon o Xamp.
Ingresa como root para administrar las bases de datos

```bash
mysql -u root -p
```

Enseguida, crea la base de datos

```bash
CREATE DATABASE gestiondocumentaldb;
```

Después, crea el usuario para administrar esta base de datos

```bash
CREATE USER 'admindocumental'@'localhost' IDENTIFIED BY 'password';
```

Le otorgas los permisos necesarios al nuevo usuario

```bash
GRANT ALL PRIVILEGES ON gestiondocumentaldb.* TO 'admindocumental'@'localhost' WITH GRANT OPTION;
```

Finalmente aplicas cambios

```bash
FLUSH PRIVILEGES;
```

---

## 6️⃣ Variable de Entorno

Es importante recordar que el proyecto cuenta con un archivo denominado .env, el cual cuenta con las credenciales para ingresar a la base de datos, anteriormente creada. Será importante que abras dicho archivo para cerciorarte que dichas credenciales estén correctas.

```
📁GESTIONDOCUMENTAL
└── 📄 .env
```

El archivo tiene una línea de códico con las credenciales para ingresar a la base de datos, y si cambiaste algún valor al momento de crear el usuario para la base de datos, solo tienes que corregir la siguiente línea de código:

```
DATABASE_URL="mysql://admindocumental:tu_password_seguro@localhost:3306/gestiondocumentaldb"
```

---

## 7️⃣ Ejecuta las migraciones

Será necesario crear la base de datos del proyecto, por lo tanto es importante mencionar que en el proyecto clonado ya incluye los modelos y relaciones de cada tabla de la base de datos que diseñaron, entonces usarás el siguiente comando para invocar el proceso de migración respectiva y así tener toda la base de datos completa.

```bash
npx prisma db push
```

Este comando creará una carpeta de migraciones en prisma/migrations y generará o actualizará la base de datos, esto en caso de haber cambios el algún modelo.

Ahora ya puedes conectar tu entorno de base datos DBeaver

![](https://github.com/dbeaver/dbeaver/wiki/images/dbeaver-head.png)

---

## 8️⃣ Configuración de Prisma

Para que el ORM reconozca los modelos y genere el cliente Prisma correctamente, será necesario ejecutar el siguiente comando:

Genera el cliente de Prisma (Obligatorio para que funcionen todos los modelos coo prisma.area)

```bash
npx prisma generate
```

No debe mostrar ningún error, deberá mostrar un mensaje similar al siguiente:

```bash
┌─────────────────────────────────────────────────────────┐
│  Update available 6.6.0 -> 7.2.0                        │
│                                                         │
│  This is a major update - please follow the guide at    │
│  https://pris.ly/d/major-version-upgrade                │
│                                                         │
│  Run the following to update                            │
│    npm i --save-dev prisma@latest                       │
│    npm i @prisma/client@latest                          │
└─────────────────────────────────────────────────────────┘
```

---

## 8️⃣ Ejecuta la App de React

Una vez realizadas todas las instalaciones y configuraciones necesarias, ya puedes ejecutar la App de escritorio de Gestión Documental. Utiliza el comando habital:

```bash
npm run dev
```

---

## 9️⃣ Pruebas Postman

Ahora puede abrir la aplicación denominada Postman, para probar las rutas que actualmente tiene el archivo server.js, ubicado en la raiz del proyecto.

```
📁GESTIONDOCUMENTAL
└── 📄 server.js
```

```javascript
// 1. Dependencias
const express = require("express");
const cors = require("cors");
const pruebasApi = require("./express/api/prueba.api");
const areasApi = require("./express/api/areas.api");
const usuariosApi = require("./express/api/usuarios.api");

// 2. Inicialización
const app = express();
const port = 3001;

// 3. Middlewares
app.use(cors());
app.use(express.json());

// 4. se definen las rutas de la api para invocar cada endpoint
app.use("/api/pruebas", pruebasApi);
app.use("/api/areas", areasApi);
app.use("/api/usuarios", usuariosApi);

// 5. Iniciar el Servidor de Express
app.listen(port, () => {
  console.log(`🚀 Express API interna corriendo en http://localhost:${port}`);
  console.log(
    `💡 Prisma se conectará automáticamente al recibir la primera petición.`
  );
});

module.exports = app;
```

Por el momento solo mostraré el ejemplo en postman, usando el método http POST para que realices las pruebas necesarias.

Utiliza la siguiente ruta: http://localhost:3001/api/usuarios

No olvides selecionar el método HTTP POST.

Ahora selecciona la opción Body y la sub opción raw en Postman. Verifica que a la derecha de GraphQL esté seleccionada la opción Json.

Recuerda que para insertar un usuario, antes debes insertar un valor en la tabla roles y otro valor en la tabla areas, ya que la excepción se va a disparar de inmedaito.
```bash
 insert into areas (nombre_area) values ('Recursos Humanos');
```
```bash
insert into roles (nombre_rol) values ('Ninguno');
```

Finalmente copia y pega en Postman el siguiente texto en formato JSON

```javascript
{
    "nombre_completo":"Rogelio Castro Torres",
    "numero_trab":125,
    "correo_electronico":"rogelio.castro@gmail.com",
    "nombre_usuario":"rogelio.castro",
    "contrasennia":"password123",
    "id_rol":1,
    "id_area":1
}
```

