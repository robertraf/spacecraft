import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";

export const getMe = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const user = await ctx.db.get(userId);
    return { userId: userId as string, email: user?.email ?? null };
  },
});

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
