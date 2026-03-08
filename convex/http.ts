/**
 * @fileoverview Rutas HTTP del backend de Convex.
 *
 * Registra las rutas HTTP necesarias para el flujo de autenticación
 * de Convex Auth (sign-up, sign-in, sign-out, verificación de tokens).
 *
 * @module http
 */

import { httpRouter } from "convex/server";
import { auth } from "./auth";

const http = httpRouter();

auth.addHttpRoutes(http);

export default http;
