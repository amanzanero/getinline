/**
 * This is a protected page
 */

import { type Position } from "@prisma/client";
import Link from "next/link";
import { useRouter } from "next/router";
import { NavLayout } from "../../../client/layouts/NavLayout";
import { useLocalLine } from "../../../client/localLineState";
import { usePusher } from "../../../client/pusherWebClient";
import { trpc } from "../../../utils/trpc";

const Line = () => {
  const router = useRouter();
  const { slug } = router.query;
  const utils = trpc.useContext();

  // query
  const {
    data: line,
    error,
    isLoading: isLineLoading,
  } = trpc.line.getBySlug.useQuery(
    {
      slug: slug as string,
    },
    {
      enabled: !!slug,
      onSuccess(data) {
        if (data) {
          flushLines(data.id, data.positions);
        }
      },
    },
  );

  const { isInLine, flushLines } = useLocalLine({ lineId: line?.id });

  // mutation
  const { mutate: removeFromLine, isLoading: isRemoving } = trpc.line.removeFromLine.useMutation({
    onMutate(vars) {
      // optimistic update
      if (line) {
        utils.line.getBySlug.setData(
          { slug: slug as string },
          { ...line, positions: line.positions.filter((p) => p.id != vars.positionId) },
        );
      }
    },
    onSettled() {
      utils.line.getBySlug.invalidate();
    },
  });

  usePusher({
    channelId: line?.id,
    enabled: true,
    eventName: line?.isOwner ? "position-added" : "position-removed",
    onEvent(incomingData: Position[]) {
      if (incomingData) {
        utils.line.getBySlug.setData(
          { slug: slug as string },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-non-null-assertion
          { ...line!, positions: incomingData },
        );
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        flushLines(line!.id, incomingData);
      }
    },
  });

  const Content = () => {
    if (!!error) {
      if (error.data?.code === "NOT_FOUND") {
        return <div>Hmmm this line doesn&apos;t seem to exist</div>;
      } else {
        return <div>whoops something went wrong</div>;
      }
    } else if (isLineLoading || !line) {
      return <div>loading...</div>;
    } else {
      return (
        <div>
          <h1 className="text-2xl text-base-content">
            Virtual line: <span className="font-bold">{line.name}</span>
          </h1>
          <div>
            {!line.isOwner && !isInLine && (
              <Link href={`/line/${line.slug}/join`}>
                <button className="btn-secondary btn mt-3 sm:mt-5">Join the line</button>
              </Link>
            )}
            <h2 className="my-5 text-xl text-base-content">Members in line:</h2>
            <ul className="space-y-5">
              {line.positions.length === 0 ? (
                <div className="italic">No members in line yet</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="table w-full">
                    <thead>
                      <tr>
                        <th>Place in line</th>
                        <th>Name</th>
                        <th># People</th>
                        {line.isOwner && <th></th>}
                      </tr>
                    </thead>
                    <tbody>
                      {line.positions.map((position, i) => (
                        <tr className="hover" key={position.id}>
                          <th>{i + 1}</th>
                          <td>{position.name}</td>
                          <td>1</td>
                          {line.isOwner && (
                            <td>
                              {i === 0 && (
                                <button
                                  className="btn-small btn-primary btn"
                                  onClick={() =>
                                    removeFromLine({
                                      positionId: position.id,
                                      lineId: position.lineId,
                                    })
                                  }
                                  disabled={isLineLoading || isRemoving}
                                >
                                  Done
                                </button>
                              )}
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </ul>
          </div>
        </div>
      );
    }
  };

  return (
    <NavLayout>
      <main className="py-5">
        <Content />
      </main>
    </NavLayout>
  );
};

export default Line;
