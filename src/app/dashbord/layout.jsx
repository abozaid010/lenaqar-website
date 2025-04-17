import Header from "@/components/dashbord/common/Header";
import Sidebar from "@/components/dashbord/common/Sidebar";

import { cookies } from "next/headers";

const Layout = async ({ children }) => {
  // Get the clientID from the cookie on the server then pass it as a prop to the Header component => To avoid hydration issues
  const cookieStore = await cookies();
  const clientID = cookieStore.get("client_id")?.value;

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-gray-100">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden  lg:pl-0">
        <Header clientID={clientID} />

        <main className=" overflow-y-auto p-4 bg-gray-100">{children}</main>
      </div>
    </div>
  );
};

export default Layout;
