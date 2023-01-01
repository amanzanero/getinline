/**
 * Consolidates line state from a query and a websocket connection
 */

import { type Session } from "next-auth";
import { trpc } from "../utils/trpc";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const useLineState = (_session: Session) => {
  const query = trpc.example.hello.useQuery();

  return query;
};
