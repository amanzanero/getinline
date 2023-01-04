import { type NextPage } from "next";
import { useSession } from "next-auth/react";
import Head from "next/head";
import { useRouter } from "next/router";
import { type SubmitHandler, useForm } from "react-hook-form";
import { NavLayout } from "../client/layouts/NavLayout";
import { trpc } from "../utils/trpc";

type Inputs = {
  name: string;
};

const Create: NextPage = () => {
  const router = useRouter();
  const { status } = useSession({ required: true });

  const isAuthed = status === "authenticated";

  const { mutate, isLoading, error } = trpc.line.create.useMutation({
    onSuccess: (line) => {
      router.push(`/line/${line.slug}`);
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<Inputs>();
  const onSubmit: SubmitHandler<Inputs> = (data) => mutate(data);

  return (
    <>
      <Head>
        <title>Create Line - GetInLine</title>
        <meta name="description" content="Create a virtual line for your event or meeting" />
      </Head>
      <NavLayout>
        {isAuthed ? (
          <main className="py-5">
            <h1 className="text-center text-2xl font-bold text-base-content">Create a new Line</h1>
            <form
              className="translate my-4 mx-auto flex max-w-screen-md flex-col items-center rounded-lg bg-base-200 p-4"
              onSubmit={handleSubmit(onSubmit)}
            >
              <div className="w-full max-w-xs">
                <input
                  className="input-bordered input w-full"
                  placeholder="Enter a name for the line"
                  {...register("name", { required: true })}
                />
                {errors.name && (
                  <div className="mt-2">
                    <span className="text-red-600">This field is required</span>
                  </div>
                )}
              </div>
              <div className="w-full max-w-xs">
                <input
                  className="btn mt-4 w-full max-w-xs"
                  value="create"
                  type="submit"
                  disabled={isLoading || !isValid}
                />
                {error && (
                  <div className="w-full">
                    <span>{error.message}</span>
                  </div>
                )}
              </div>
            </form>
          </main>
        ) : (
          <div>loading...</div>
        )}
      </NavLayout>
    </>
  );
};

export default Create;
