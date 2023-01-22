import Pusher from "pusher-js";
import { useEffect, useState } from "react";
import { clientEnv } from "../env/schema.mjs";

interface PusherProps {
  channelId?: string;
  eventName: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onEvent: (data: any) => void;
  enabled: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const pusher = new Pusher(clientEnv.NEXT_PUBLIC_PUSHER_APP_KEY!, { cluster: "us3" });

export const usePusher = ({ channelId, enabled, eventName, onEvent }: PusherProps) => {
  const [channel, setChannel] = useState<string>();
  useEffect(() => {
    const configureChannel = () => {
      if (channelId && enabled) {
        const newChannel = pusher.subscribe(channelId);
        newChannel.bind(eventName, onEvent);
      }
    };

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    setChannel((prevChannel) => {
      if (prevChannel != channelId) {
        if (prevChannel) {
          pusher.unsubscribe(prevChannel);
        }
        configureChannel();
      }
      return channelId;
    });

    return () => {
      pusher.unbind_all();
    };
  }, [enabled, channelId, eventName, onEvent]);

  return channel;
};
