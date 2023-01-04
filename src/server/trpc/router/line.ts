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

  getBySlug: publicProcedure.input(z.object({ slug: z.string() })).query(async ({ ctx, input }) => {
    const line = await ctx.prisma.line.findUnique({
      where: { slug: input.slug },
      include: { positions: true },
    });
    if (!line) {
      throw new TRPCError({ code: "NOT_FOUND" });
    }
    return line;
  }),

  join: publicProcedure
    .input(
      z.object({
        slug: z.string(),
        name: z.string().min(2),
        phoneNumber: z.string().min(9),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const existingLine = await ctx.prisma.line.findUnique({
        where: { slug: input.slug },
      });
      if (!existingLine) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      const existingPosition = await ctx.prisma.position.findUnique({
        where: {
          lineId_phoneNumber: {
            lineId: existingLine.id,
            phoneNumber: input.phoneNumber,
          },
        },
      });

      if (!!existingPosition) {
        return existingPosition;
      }
      await ctx.prisma.$transaction(async (tx) => {
        const line = await tx.line.update({
          where: { id: existingLine.id },
          data: {
            lastInLineRank: {
              increment: 1,
            },
          },
          select: {
            lastInLineRank: true,
          },
        });
        if (!line) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        }
        return await tx.position.create({
          data: {
            name: input.name,
            phoneNumber: input.phoneNumber,
            lineId: existingLine.id,
            rank: line.lastInLineRank - 1,
          },
        });
      });
    }),
});
