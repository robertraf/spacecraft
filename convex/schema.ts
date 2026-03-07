import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,
  players: defineTable({
    userId: v.id("users"),
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
  }).index("by_user", ["userId"]),
});
