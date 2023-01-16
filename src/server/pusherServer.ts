import Pusher from "pusher";
import { env } from "../env/server.mjs";

declare global {
  // eslint-disable-next-line no-var
  var pusher: Pusher | undefined;
}

export const pusher =
  global.pusher ||
  new Pusher({
    appId: env.PUSHER_APP_ID,
    key: env.NEXT_PUBLIC_PUSHER_APP_KEY,
    secret: env.PUSHER_APP_SECRET,
    cluster: "us3",
    useTLS: true,
  });

if (env.NODE_ENV !== "production") {
  global.pusher = pusher;
}
