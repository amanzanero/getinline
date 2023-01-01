/**
 * This is a protected page
 */

import { useSession } from "next-auth/react";
import { NavLayout } from "../../client/layouts/NavLayout";

const Line = () => {
  const {} = useSession({ required: true });
  return <NavLayout>hi there</NavLayout>;
};

export default Line;
