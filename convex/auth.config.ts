/**
 * @fileoverview OAuth configuration for Convex Auth.
 *
 * Defines the application domain used for token verification
 * and authentication provider configuration. The domain is obtained
 * from the `CONVEX_SITE_URL` environment variable in the Convex deployment.
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
