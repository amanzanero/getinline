/**
 * This is a protected page
 */

import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/router";
import { NavLayout } from "../../../client/layouts/NavLayout";
import { trpc } from "../../../utils/trpc";

const Line = () => {
  const router = useRouter();
  const { slug } = router.query;
  const { data: session, status } = useSession({ required: false });
  const { data: line, error } = trpc.line.getBySlug.useQuery(
    {
      slug: slug as string,
    },
    { enabled: !!slug },
  );

  const isOwner = line?.ownerId === session?.user?.id;

  const Content = () => {
    if (!!error) {
      if (error.data?.code === "NOT_FOUND") {
        return <div>Hmmm this line doesn&apos;t seem to exist</div>;
      } else {
        return <div>whoops something went wrong</div>;
      }
    } else if (status === "loading" || !line) {
      return <div>loading...</div>;
    } else {
      return (
        <div>
          <h1 className="text-2xl text-base-content">
            Virtual line: <span className="font-bold">{line.name}</span>
          </h1>
          <div>
            {!isOwner && (
              <Link href={`/line/${line.slug}/join`}>
                <button className="btn-secondary btn mt-3 sm:mt-5">Join the line</button>
              </Link>
            )}
            <h2 className="my-5 text-xl text-base-content">Members in line:</h2>
            <ul>
              {line.positions.length === 0 ? (
                <li className="italic">No members in line yet</li>
              ) : (
                line.positions.map((position, i) => (
                  <div key={position.id}>
                    {i + 1}. {position.name}
                  </div>
                ))
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
