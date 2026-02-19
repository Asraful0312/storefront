
import { defineApp } from "convex/server";
import cloudinary from "@imaxis/cloudinary-convex/convex.config";
import aggregate from "@convex-dev/aggregate/convex.config";
import stripe from "@convex-dev/stripe/convex.config.js";
import resend from "@convex-dev/resend/convex.config.js";

const app = defineApp();
app.use(cloudinary);
app.use(aggregate);
app.use(stripe);
app.use(resend);

export default app;