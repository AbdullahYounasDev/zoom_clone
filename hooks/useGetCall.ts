import { useUser } from "@clerk/nextjs";
import { Call, useStreamVideoClient } from "@stream-io/video-react-sdk";
import { useEffect, useState } from "react";

export const useGetCall = () => {
  const [call, setCall] = useState<Call[]>([]);
  const client = useStreamVideoClient();
  const { user } = useUser();
  const [isLoading, setisLoading] = useState(false);

  useEffect(() => {
    const loadCall = async () => {
      if (!client || !user?.id) return;

      setisLoading(true);
      try {
        // https://getstream.io/video/docs/react/guides/querying-calls/#filters
        const { calls } = await client?.queryCalls({
          sort: [{ field: "starts_at", direction: -1 }],
          filter_conditions: {
            starts_at: { $exists: true },
            $or: [
              { created_by_user_id: user.id },
              { members: { $in: [user.id] } },
            ],
          },
        });
        setCall(calls);
      } catch (error) {
        console.log(error);
      } finally {
        setisLoading(false);
      }
    };
    loadCall();
  }, [client, user?.id]);
  const now = new Date();
  const endedCall = call?.filter(({ state: { startsAt, endedAt } }: Call) => {
    return (startsAt && new Date(startsAt) < now) || !!endedAt;
  });
  const upcomingCall = call?.filter(({ state: { startsAt } }: Call) => {
    return startsAt && new Date(startsAt) > now;
  });

  return {
    endedCall,
    upcomingCall,
    recordingsCall: call,
    isLoading,
  };
};
