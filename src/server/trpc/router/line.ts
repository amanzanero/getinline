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
      include: {
        positions: {
          orderBy: { rank: "asc" },
        },
      },
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
      const createdPosition = await ctx.prisma.$transaction(async (tx) => {
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
          include: { line: true },
        });
      });
      const response = await ctx.pusher.trigger(existingLine.id, "position-added", {
        msg: "removed",
      });
      if (!response.ok) {
        // log here that we failed to update clients in real time
      }
      return createdPosition;
    }),

  removeFromLine: publicProcedure
    .input(
      z.object({ positionId: z.string(), lineId: z.string(), password: z.string().optional() }),
    )
    .mutation(
      async ({ ctx: { session, pusher, prisma }, input: { positionId, lineId, password } }) => {
        const line = await prisma.line.findUnique({
          where: {
            id: lineId,
          },
        });
        if (!line || (line.ownerId !== session?.user?.id && line.password !== password)) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        await prisma.position.delete({
          where: {
            id: positionId,
          },
        });
        const newLine = await prisma.line.findUnique({
          where: { id: lineId },
          include: { positions: true },
        });
        const response = await pusher.trigger(lineId, "position-removed", newLine);
        if (!response.ok) {
          // log here that we failed to update clients in real time
        }
        return newLine;
      },
    ),
});
