/**
 * @fileoverview HTTP routes for the Convex backend.
 *
 * Registers the HTTP routes needed for the Convex Auth authentication
 * flow (sign-up, sign-in, sign-out, token verification).
 *
 * @module http
 */

import { httpRouter } from "convex/server";
import { auth } from "./auth";

const http = httpRouter();

auth.addHttpRoutes(http);

export default http;
