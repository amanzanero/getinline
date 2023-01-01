import { useSession, signIn, signOut } from "next-auth/react";
import Link from "next/link";
import React from "react";

export const NavLayout: React.FC<React.PropsWithChildren> = (props) => {
  const { data: session } = useSession();

  return (
    <div className="flex flex-col">
      <div className="navbar bg-primary text-primary-content">
        <div className="mx-auto w-full max-w-screen-xl">
          <div className="navbar-start">
            <Link className="btn-ghost btn text-xl normal-case" href="/">
              GetInLine
            </Link>
          </div>
          <div className="navbar-end flex justify-end">
            {!session ? (
              <button onClick={() => signIn()} className="btn">
                Sign In
              </button>
            ) : (
              <button onClick={() => signOut()} className="btn">
                Sign Out
              </button>
            )}
          </div>
        </div>
      </div>
      <div className="mx-auto w-full max-w-screen-xl grow px-2 xl:px-0">
        {props.children}
      </div>
    </div>
  );
};
