import { query } from "./_generated/server";
import { v } from "convex/values";

export const inspectLastOrder = query({
  args: {},
  handler: async (ctx) => {
    const order = await ctx.db.query("orders").order("desc").first();
    if (!order) return "No orders found";

    const itemsWithProduct = await Promise.all(
      order.items.map(async (item) => {
        const product = await ctx.db.get(item.productId);
        return {
          item,
          product,
          hasFiles: product?.digitalFiles && product.digitalFiles.length > 0,
        };
      })
    );

    return {
      orderId: order._id,
      items: itemsWithProduct,
    };
  },
});
