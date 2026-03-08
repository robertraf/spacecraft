/**
 * @fileoverview Configuración de autenticación de Convex Auth.
 *
 * Configura dos proveedores de autenticación:
 * - **Anonymous**: Permite jugar sin registro (sesión temporal).
 * - **Password**: Permite crear cuenta con email/password para persistir progreso.
 *
 * @module auth
 */

import { convexAuth } from "@convex-dev/auth/server";
import { Anonymous } from "@convex-dev/auth/providers/Anonymous";
import { Password } from "@convex-dev/auth/providers/Password";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Anonymous,
    Password,
  ],
});
