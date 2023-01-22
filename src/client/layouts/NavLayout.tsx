import Link from "next/link";
import React from "react";

export const NavLayout: React.FC<React.PropsWithChildren> = (props) => {
  return (
    <>
      <nav className="navbar bg-primary text-primary-content">
        <div className="mx-auto w-full max-w-screen-xl">
          <div className="navbar-start">
            <Link className="btn-ghost btn text-xl normal-case" href="/">
              GetInLine
            </Link>
          </div>
        </div>
      </nav>
      <div className="flex flex-col bg-base-100">
        <div className="mx-auto w-full max-w-screen-xl grow px-2 xl:px-0">{props.children}</div>
      </div>
    </>
  );
};
