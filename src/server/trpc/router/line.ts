import crypto from "crypto";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { nanoid } from "../../common/nanoid";
import { router, publicProcedure } from "../trpc";
import { linePassCookieName, omit, ownsLine } from "../../../utils/lineUtils";

const generatePassword = (
  length = 20,
  wishlist = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz~!@-#$",
) =>
  Array.from(crypto.getRandomValues(new Uint32Array(length)))
    .map((x) => wishlist[x % wishlist.length])
    .join("");

export const lineRouter = router({
  create: publicProcedure
    .input(z.object({ name: z.string().min(2) }))
    .mutation(async ({ ctx, input }) => {
      const randomPassword = generatePassword();
      const newLine = await ctx.prisma.line.create({
        data: {
          name: input.name,
          lastInLineRank: 0,
          slug: nanoid(),
          password: randomPassword,
        },
      });
      ctx.setCookie(linePassCookieName(newLine), randomPassword);
      return { ...omit(newLine, "password"), isOwner: true };
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
    const isOwner = line.password === ctx.cookies[linePassCookieName(line)];
    return { ...omit(line, "password"), isOwner };
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
      const createdPosition = await ctx.prisma.$transaction(async (tx) => {
        const line = await tx.line.update({
          where: { slug: input.slug },
          data: {
            lastInLineRank: {
              increment: 1,
            },
          },
          select: {
            id: true,
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
            lineId: line.id,
            rank: line.lastInLineRank - 1,
          },
        });
      });
      const newLine = await ctx.prisma.line.findUnique({
        where: { id: createdPosition.lineId },
        include: { positions: true },
      });
      const response = await ctx.pusher.trigger(
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion, @typescript-eslint/no-extra-non-null-assertion
        newLine!!.id,
        "position-added",
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion, @typescript-eslint/no-extra-non-null-assertion
        newLine!!.positions,
      );
      if (!response.ok) {
        // TODO: log here that we failed to update clients in real time
      }
      return createdPosition;
    }),

  removeFromLine: publicProcedure
    .input(z.object({ positionId: z.string(), lineId: z.string() }))
    .mutation(async ({ ctx: { pusher, prisma, cookies }, input: { positionId, lineId } }) => {
      const line = await prisma.line.findUnique({
        where: {
          id: lineId,
        },
      });
      const isOwner = !!line && ownsLine(line, cookies);
      if (!isOwner) {
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
      const response = await pusher.trigger(
        lineId,
        "position-removed",
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion, @typescript-eslint/no-extra-non-null-assertion
        newLine!!.positions,
      );
      if (!response.ok) {
        // TODO: log here that we failed to update clients in real time
      }
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion, @typescript-eslint/no-extra-non-null-assertion
      return { ...omit(newLine!!, "password"), isOwner };
    }),
});
