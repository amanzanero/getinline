import type { NextPage } from "next";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { type SubmitHandler, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { NavLayout } from "../../../client/layouts/NavLayout";
import { trpc } from "../../../utils/trpc";
import { useLocalLine } from "../../../client/localLineState";

type Inputs = {
  name: string;
  phoneNumber: string;
};

const Join: NextPage = () => {
  const router = useRouter();
  const { slug } = router.query;
  const { status, data: session } = useSession({ required: false });
  const { data: line, error } = trpc.line.getBySlug.useQuery(
    {
      slug: slug as string,
    },
    { enabled: !!slug },
  );
  const { joinLine } = useLocalLine({ lineId: line?.id });

  // prevent owners from trying to join the line
  useEffect(() => {
    if (
      status === "authenticated" &&
      !!session.user &&
      !!line &&
      line.ownerId === session.user.id
    ) {
      router.push(`/line/${line.slug}`);
    }
  }, [status, line, router, session]);

  const {
    mutate,
    isLoading,
    error: mutationError,
  } = trpc.line.join.useMutation({
    onSuccess: (p) => {
      joinLine(p);
      router.push(`/line/${slug}`);
    },
  });
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<Inputs>({
    mode: "onTouched",
    resolver: zodResolver(
      z.object({
        name: z.string().min(2, { message: "Required" }),
        phoneNumber: z.string().min(9, { message: "Required" }),
      }),
    ),
  });
  const onSubmit: SubmitHandler<Inputs> = (data) => mutate({ ...data, slug: slug as string });

  const Content = () => {
    if (!!error) {
      if (error.data?.code === "NOT_FOUND") {
        return <div>Hmmm this line doesn&apos;t seem to exist</div>;
      } else {
        return <div>whoops something went wrong</div>;
      }
    } else if (status !== "unauthenticated" || !line) {
      return <div>loading...</div>;
    } else {
      return (
        <form
          className="translate my-4 mx-auto flex max-w-screen-md flex-col items-center rounded-lg bg-base-200 p-4"
          onSubmit={handleSubmit(onSubmit)}
        >
          <h1 className="text-2xl">
            Join <span className="font-bold">{line.name}</span>
          </h1>
          <div className="mt-1 w-full max-w-xs">
            <div className="form-control w-full">
              <label className="label">
                <span className="label-text">Name</span>
              </label>
              <input
                className="input-bordered input w-full"
                placeholder="Enter a name for the line"
                {...register("name", { required: true })}
              />
            </div>
            {errors.name && (
              <div className="mt-1">
                <span className="text-red-600">This field is required</span>
              </div>
            )}
          </div>
          <div className="mt-1 w-full max-w-xs">
            <div className="form-control w-full">
              <label className="label">
                <span className="label-text">Phone Number</span>
              </label>
              <input
                type="tel"
                className="input-bordered input w-full"
                placeholder="Enter your phone number"
                {...register("phoneNumber", { required: true })}
              />
            </div>
            {errors.phoneNumber && (
              <div className="mt-1">
                <span className="text-red-600">This field is required</span>
              </div>
            )}
          </div>
          <div className="mt-2 w-full max-w-xs">
            <input
              className="btn mt-4 w-full max-w-xs"
              value="Join"
              type="submit"
              disabled={isLoading || !isValid}
            />
            {mutationError && (
              <div className="w-full">
                <span>{mutationError.message}</span>
              </div>
            )}
          </div>
        </form>
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

export default Join;
