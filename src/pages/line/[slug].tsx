/**
 * This is a protected page
 */

import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { NavLayout } from "../../client/layouts/NavLayout";
import { trpc } from "../../utils/trpc";

const Line = () => {
  const router = useRouter();
  const { slug } = router.query;
  const { data: session } = useSession({ required: false });
  const { data: line, error } = trpc.line.getBySlug.useQuery(
    { slug: slug as string },
    {
      enabled: !!session,
      onError: (err) => {
        if (err.data?.code === "NOT_FOUND") {
          router.push("/404");
        }
      },
    }
  );

  const Content = () => {
    if (!!error) {
      if (error.data?.code === "NOT_FOUND") {
        return <div>Hmmm this line doesn&apos;t seem to exist</div>;
      } else {
        return <div>whoops something went wrong</div>;
      }
    } else if (!session || !line) {
      return <div>loading...</div>;
    } else {
      return (
        <div>
          <h1 className="text-2xl text-base-content">
            Virtual line: <span className="font-bold">{line.name}</span>
          </h1>
          <div>
            <h2 className="my-5 text-xl text-base-content">Members in line:</h2>
            <ul>
              {line.positions.length === 0 ? (
                <li>No members in line yet</li>
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
