/**
 * @fileoverview Configuración de OAuth para Convex Auth.
 *
 * Define el dominio de la aplicación usado para verificación de tokens
 * y configuración de proveedores de autenticación. El dominio se obtiene
 * de la variable de entorno `CONVEX_SITE_URL` del deployment de Convex.
 *
 * @module auth.config
 */

export default {
  providers: [
    {
      domain: process.env.CONVEX_SITE_URL,
      applicationID: "convex",
    },
  ],
};
