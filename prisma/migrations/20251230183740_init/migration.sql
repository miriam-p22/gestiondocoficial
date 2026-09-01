-- CreateTable
CREATE TABLE `roles` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre_rol` VARCHAR(255) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `areas` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre_area` VARCHAR(255) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `privilegios` (
    `id` INTEGER NOT NULL,
    `titulo_privilegio` VARCHAR(255) NOT NULL,
    `zona` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `claverh` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `clave` VARCHAR(255) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `clasificaciones` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `area_administrativa` VARCHAR(255) NULL,
    `codigo_asignado` VARCHAR(255) NULL,
    `ubicacion` VARCHAR(255) NULL,
    `funcion` VARCHAR(255) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `usuarios` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `id_rol` INTEGER NOT NULL,
    `id_area` INTEGER NOT NULL,
    `nombre_completo` VARCHAR(255) NOT NULL,
    `numero_trab` INTEGER NULL,
    `correo_electronico` VARCHAR(255) NULL,
    `nombre_usuario` VARCHAR(255) NULL,
    `contrasenia` VARCHAR(255) NULL,
    `status` BOOLEAN NOT NULL DEFAULT false,
    `fecha_creacion` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `roles_permisos` (
    `id_rol` INTEGER NOT NULL,
    `id_privilegio` INTEGER NOT NULL,
    `fecha_asignacion` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id_rol`, `id_privilegio`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `organigramas` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `id_usuario` INTEGER NOT NULL,
    `titulo` VARCHAR(255) NULL,
    `version` INTEGER NULL,
    `fecha_solicitud` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `fecha_autorizacion` DATETIME(3) NULL,
    `autorizado` BOOLEAN NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `niveles` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `id_organigrama` INTEGER NOT NULL,
    `id_area` INTEGER NOT NULL,
    `nivel` INTEGER NULL,
    `area_superior` VARCHAR(255) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ips` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `id_area` INTEGER NOT NULL,
    `ip_rh` BOOLEAN NULL,
    `ip_areas` VARCHAR(255) NULL,
    `grupo` VARCHAR(255) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `documentos` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `id_area` INTEGER NOT NULL,
    `id_clasificacion` INTEGER NOT NULL,
    `num_oficio` VARCHAR(255) NULL,
    `asunto` VARCHAR(255) NULL,
    `archivo` VARCHAR(255) NULL,
    `titulo_documento` VARCHAR(255) NULL,
    `fecha_recepcion` DATETIME(3) NULL,
    `fecha_asignacion` DATETIME(3) NULL,
    `fecha_limite` DATETIME(3) NULL,
    `fecha_respuesta` DATETIME(3) NULL,
    `respuesta_recibida` VARCHAR(255) NULL,
    `fecha_entrega` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `estados` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `id_documento` INTEGER NOT NULL,
    `nombre_estado` VARCHAR(255) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `configuraciones` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `id_usuario` INTEGER NOT NULL,
    `correo_remitente` VARCHAR(255) NULL,
    `contrasenia` VARCHAR(255) NULL,
    `smtp` VARCHAR(255) NULL,
    `puerto` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `usuarios` ADD CONSTRAINT `usuarios_id_rol_fkey` FOREIGN KEY (`id_rol`) REFERENCES `roles`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `usuarios` ADD CONSTRAINT `usuarios_id_area_fkey` FOREIGN KEY (`id_area`) REFERENCES `areas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `roles_permisos` ADD CONSTRAINT `roles_permisos_id_rol_fkey` FOREIGN KEY (`id_rol`) REFERENCES `roles`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `roles_permisos` ADD CONSTRAINT `roles_permisos_id_privilegio_fkey` FOREIGN KEY (`id_privilegio`) REFERENCES `privilegios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `organigramas` ADD CONSTRAINT `organigramas_id_usuario_fkey` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `niveles` ADD CONSTRAINT `niveles_id_organigrama_fkey` FOREIGN KEY (`id_organigrama`) REFERENCES `organigramas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `niveles` ADD CONSTRAINT `niveles_id_area_fkey` FOREIGN KEY (`id_area`) REFERENCES `areas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ips` ADD CONSTRAINT `ips_id_area_fkey` FOREIGN KEY (`id_area`) REFERENCES `areas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `documentos` ADD CONSTRAINT `documentos_id_area_fkey` FOREIGN KEY (`id_area`) REFERENCES `areas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `documentos` ADD CONSTRAINT `documentos_id_clasificacion_fkey` FOREIGN KEY (`id_clasificacion`) REFERENCES `clasificaciones`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `estados` ADD CONSTRAINT `estados_id_documento_fkey` FOREIGN KEY (`id_documento`) REFERENCES `documentos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `configuraciones` ADD CONSTRAINT `configuraciones_id_usuario_fkey` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
