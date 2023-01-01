import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { nanoid } from "../../common/nanoid";
import { router, protectedProcedure, publicProcedure } from "../trpc";

export const lineRouter = router({
  create: protectedProcedure
    .input(z.object({ name: z.string().min(2) }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.prisma.line.create({
        data: {
          name: input.name,
          ownerId: ctx.session.user.id,
          lastInLineRank: 0,
          slug: nanoid(),
        },
      });
    }),

  getBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      const line = await ctx.prisma.line.findUnique({
        where: { slug: input.slug },
        include: { positions: true },
      });
      if (!line) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      return line;
    }),
});
