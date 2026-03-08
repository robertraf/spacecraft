/**
 * @fileoverview Convex Auth authentication configuration.
 *
 * Configures two authentication providers:
 * - **Anonymous**: Allows playing without registration (temporary session).
 * - **Password**: Allows creating an account with email/password to persist progress.
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
