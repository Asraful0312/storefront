import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Fetch exchange rates every 6 hours
crons.interval(
  "fetch exchange rates",
  { hours: 6 },
  internal.exchangeRates.fetchRates,
);

export default crons;
