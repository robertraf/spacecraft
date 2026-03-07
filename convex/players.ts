/**
 * @fileoverview Queries y mutations de jugadores para el backend de Convex.
 *
 * Provee las operaciones de lectura y escritura del estado de juego:
 * - {@link getMe}: Obtiene info del usuario autenticado.
 * - {@link getMyPlayer}: Obtiene el estado de juego guardado del jugador.
 * - {@link saveGameState}: Persiste el estado de juego actual (upsert).
 *
 * @module players
 */

import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";

/**
 * Obtiene la información básica del usuario autenticado.
 *
 * @returns {{ userId: string, email: string | null } | null}
 *   Objeto con el ID y email del usuario, o `null` si no está autenticado.
 */
export const getMe = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const user = await ctx.db.get(userId);
    return { userId: userId as string, email: user?.email ?? null };
  },
});

/**
 * Obtiene el estado de juego guardado del jugador autenticado.
 *
 * Busca en la tabla `players` usando el índice `by_user` para encontrar
 * el registro único asociado al usuario.
 *
 * @returns {Object | null} Documento completo del jugador o `null`
 *   si no existe (jugador nuevo) o no está autenticado.
 */
export const getMyPlayer = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    return await ctx.db
      .query("players")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
  },
});

/**
 * Persiste el estado de juego del jugador autenticado.
 *
 * Implementa un patrón upsert: si el jugador ya tiene un registro,
 * lo actualiza con `patch`; si es nuevo, inserta un registro completo.
 * No hace nada si el usuario no está autenticado.
 */
export const saveGameState = mutation({
  args: {
    currentPlanetId: v.string(),
    discoveredPlanets: v.array(v.string()),
    inventory: v.record(v.string(), v.number()),
    equipment: v.array(v.string()),
    craftedItems: v.array(v.string()),
    stats: v.object({
      itemsMined: v.number(),
      itemsCrafted: v.number(),
      planetsVisited: v.number(),
    }),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return;

    const existing = await ctx.db
      .query("players")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, args);
    } else {
      await ctx.db.insert("players", { userId, ...args });
    }
  },
});
