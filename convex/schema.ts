/**
 * @fileoverview Convex database schema for SpaceCraft.
 *
 * Defines the `players` table that stores each player's persistent game
 * state, including inventory, equipment, discovered planets, and
 * statistics. Also includes Convex Auth authentication tables.
 *
 * @module schema
 */

import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,

  /**
   * Players table with persistent game state.
   * Indexed by `userId` for efficient lookups of the authenticated player.
   */
  players: defineTable({
    /** Authenticated user ID (reference to the `users` table). */
    userId: v.id("users"),
    /** ID of the planet where the player is currently located. */
    currentPlanetId: v.string(),
    /** IDs of planets the player has visited. */
    discoveredPlanets: v.array(v.string()),
    /** Map of itemId to quantity in inventory. */
    inventory: v.record(v.string(), v.number()),
    /** IDs of currently equipped items. */
    equipment: v.array(v.string()),
    /** IDs of items the player has crafted at least once. */
    craftedItems: v.array(v.string()),
    /** Accumulated player statistics. */
    stats: v.object({
      itemsMined: v.number(),
      itemsCrafted: v.number(),
      planetsVisited: v.number(),
    }),
  }).index("by_user", ["userId"]),
});
