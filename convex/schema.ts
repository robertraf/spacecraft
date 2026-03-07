/**
 * @fileoverview Esquema de base de datos de Convex para SpaceCraft.
 *
 * Define la tabla `players` que almacena el estado de juego persistente
 * de cada jugador, incluyendo inventario, equipo, planetas descubiertos
 * y estadísticas. También incluye las tablas de autenticación de Convex Auth.
 *
 * @module schema
 */

import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,

  /**
   * Tabla de jugadores con su estado de juego persistente.
   * Indexada por `userId` para búsquedas eficientes del jugador autenticado.
   */
  players: defineTable({
    /** ID del usuario autenticado (referencia a la tabla `users`). */
    userId: v.id("users"),
    /** ID del planeta donde se encuentra el jugador actualmente. */
    currentPlanetId: v.string(),
    /** IDs de planetas que el jugador ha visitado. */
    discoveredPlanets: v.array(v.string()),
    /** Mapa de itemId a cantidad en inventario. */
    inventory: v.record(v.string(), v.number()),
    /** IDs de ítems equipados actualmente. */
    equipment: v.array(v.string()),
    /** IDs de ítems que el jugador ha crafteado al menos una vez. */
    craftedItems: v.array(v.string()),
    /** Estadísticas acumuladas del jugador. */
    stats: v.object({
      itemsMined: v.number(),
      itemsCrafted: v.number(),
      planetsVisited: v.number(),
    }),
  }).index("by_user", ["userId"]),
});
