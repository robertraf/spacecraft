/**
 * @fileoverview Player queries and mutations for the Convex backend.
 *
 * Provides read and write operations for the game state:
 * - {@link getMe}: Gets info about the authenticated user.
 * - {@link getMyPlayer}: Gets the player's saved game state.
 * - {@link saveGameState}: Persists the current game state (upsert).
 *
 * @module players
 */

import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";

/**
 * Gets basic information about the authenticated user.
 *
 * @returns {{ userId: string, email: string | null } | null}
 *   Object with the user ID and email, or `null` if not authenticated.
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
 * Gets the saved game state for the authenticated player.
 *
 * Looks up the `players` table using the `by_user` index to find
 * the unique record associated with the user.
 *
 * @returns {Object | null} Full player document or `null`
 *   if it doesn't exist (new player) or user is not authenticated.
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
 * Persists the game state for the authenticated player.
 *
 * Implements an upsert pattern: if the player already has a record,
 * it updates with `patch`; if new, inserts a full record.
 * Does nothing if the user is not authenticated.
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
