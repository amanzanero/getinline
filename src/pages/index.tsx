import { type NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { NavLayout } from "../client/layouts/NavLayout";

const Home: NextPage = () => {
  return (
    <>
      <Head>
        <title>GetInLine</title>
        <meta
          name="description"
          content="Get in line virtually with our free system. No more waiting in person - join the virtual queue from anywhere. Streamline your errands and appointments with our convenient service."
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <NavLayout>
        <main className="flex justify-center py-5">
          <Link href="/create">
            <button className="btn">Create a Line</button>
          </Link>
        </main>
      </NavLayout>
    </>
  );
};

export default Home;
