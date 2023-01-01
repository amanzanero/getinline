import { router } from "../trpc";
import { lineRouter } from "./line";

export const appRouter = router({
  line: lineRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
