/**
 * @fileoverview Convex Auth authentication configuration.
 *
 * Configures three authentication providers:
 * - **Anonymous**: Allows playing without registration (temporary session).
 * - **Password**: Allows creating an account with email/password to persist progress.
 * - **Google**: Enables OAuth sign-in with Google.
 *
 * @module auth
 */

import { convexAuth } from "@convex-dev/auth/server";
import Google from "@auth/core/providers/google";
import { Anonymous } from "@convex-dev/auth/providers/Anonymous";
import { Password } from "@convex-dev/auth/providers/Password";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Anonymous,
    Password,
    Google,
  ],
});
