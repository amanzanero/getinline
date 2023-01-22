import { type inferAsyncReturnType } from "@trpc/server";
import { type CreateNextContextOptions } from "@trpc/server/adapters/next";
import cookie from "cookie";

import { prisma } from "../db/client";
import { pusher } from "../pusherServer";
import { env } from "../../env/server.mjs";

type CreateContextOptions = {
  setCookie: (name: string, value: string) => void;
  cookies: Record<string, string>;
};

/** Use this helper for:
 * - testing, so we dont have to mock Next.js' req/res
 * - trpc's `createSSGHelpers` where we don't have req/res
 * @see https://create.t3.gg/en/usage/trpc#-servertrpccontextts
 **/
export const createContextInner = async (opts: CreateContextOptions) => {
  return {
    ...opts,
    prisma,
    pusher,
  };
};

/**
 * This is the actual context you'll use in your router
 * @link https://trpc.io/docs/context
 **/
export const createContext = async (opts: CreateNextContextOptions) => {
  const { req, res } = opts;

  // Get the session from the server using the unstable_getServerSession wrapper function

  const cookies = cookie.parse(req.headers.cookie || "");

  return await createContextInner({
    cookies,
    setCookie(name, value) {
      res.setHeader(
        "Set-Cookie",
        cookie.serialize(name, value, {
          httpOnly: true,
          secure: env.NODE_ENV === "production",
          sameSite: true,
        }),
      );
    },
  });
};

export type Context = inferAsyncReturnType<typeof createContext>;
