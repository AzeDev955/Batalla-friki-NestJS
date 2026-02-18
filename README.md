# Batalla Friki - NestJS Backend

<p align="center">
  <a href="http://nestjs.com/" target="blank">
    <img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" />
  </a>
</p>

## Descripción
Este es el motor de backend para **Batalla Friki**, una aplicación de combate por turnos construida con el framework [NestJS](https://github.com/nestjs/nest). El sistema permite gestionar usuarios, personajes y batallas en modalidades PvP (Jugador contra Jugador) y PvE (Jugador contra Entorno), utilizando WebSockets para la comunicación en tiempo real y Prisma como ORM.

## Tecnologías Principales
* **Framework:** NestJS 11.
* **Base de Datos:** PostgreSQL.
* **ORM:** Prisma (Client & Adapter).
* **Comunicación en Tiempo Real:** Socket.io (WebSockets).
* **Seguridad:** Passport.js, JWT y Bcrypt.
* **Validación:** Class-validator y Class-transformer.
* **Contenedores:** Docker & Docker Compose.

## Requisitos Previos
* [Node.js](https://nodejs.org/) (v22.x recomendado).
* [Yarn](https://yarnpkg.com/).
* [Docker](https://www.docker.com/) y Docker Compose.

## Configuración del Proyecto

### 1. Instalación de dependencias y entorno
```bash
yarn install
```
* Linux / Mac:
```bash
cp .env.example .env
```
* Windows:
```bash
copy .env.example .env
```
### 2. Base de Datos (Docker)
El proyecto incluye un archivo docker-compose.yml para levantar una instancia de PostgreSQL:
```bash
docker-compose up -d
```
Configuración por defecto:

* User: admin@batalla.com

* Password: admin

* DB: batalla_friki

* Port: 5432

### 3. Prisma y Generación de Cliente
El proyecto utiliza una ruta personalizada para el cliente generado en ./generated/prisma2. Ejecuta los siguientes comandos para sincronizar la base de datos:
```bash
npx prisma migrate dev
```
### 4. Poblado de datos (Seeds)
Para cargar los personajes y usuarios iniciales en la base de datos:

```bash
yarn seed
```
Scripts Disponibles

* yarn run start:dev: Inicia en modo desarrollo con watch mode.
* yarn run test: Ejecuta las pruebas unitarias con Jest.

Arquitectura de la Base de Datos
El esquema de Prisma (schema.prisma) define las siguientes entidades principales:

* User: Gestiona credenciales, roles (ADMIN/USER), nivel, experiencia (XP) y estadísticas de combate.

* Character: Define las estadísticas de los personajes como HP (puntos de vida), ataque y nivel mínimo requerido.

* Battle: Registra el estado de los combates, turnos, vida actual de los contendientes y un log histórico de acciones.

Características de la API
* CORS: Habilitado para todos los orígenes (*) en el punto de entrada principal.

* Autenticación: Protegida mediante estrategias JWT.

* WebSockets: Implementado para gestionar el flujo de combate y actualizaciones en tiempo real.

Estructura del Proyecto
* src/auth: Gestión de autenticación, guards y estrategias JWT.

* src/users: CRUD y lógica de progresión de usuarios.

* src/characters: Gestión de catálogo de personajes.

* src/battles: Lógica central de combate y Gateway de WebSockets.

* prisma/: Migraciones y scripts de poblado (seeds).

