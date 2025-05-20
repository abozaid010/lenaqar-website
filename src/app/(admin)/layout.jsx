import Header from "@/components/dashbord/common/Header";
import Sidebar from "@/components/dashbord/common/Sidebar";
import { I18nProvider } from "@/context/translate-api";

import { cookies } from "next/headers";

const Layout = async ({ children }) => {
  // Get the clientID from the cookie on the server then pass it as a prop to the Header component => To avoid hydration issues
  const cookieStore = await cookies();
  const clientID = cookieStore.get("client_id")?.value;
  const clientName = JSON.parse(
    cookieStore.get("client_info")?.value
  )?.client_name;
  

  // Get the initial locale from the cookie
  const langCookie = cookieStore.get("lang")?.value;
  const supportedLocales = ["en", "ar"];
  const defaultLocale = "ar";
  const initialLocale = supportedLocales.includes(langCookie)
    ? langCookie
    : defaultLocale;

  return (
    <I18nProvider initialLocal={initialLocale}>
      <div className="flex flex-col lg:flex-row h-screen bg-gray-50">
        <Sidebar />

        <div className="flex-1 flex flex-col overflow-hidden lg:pl-0">
          <Header clientName={clientName} clientID={clientID} />

          <main className="overflow-y-auto p-3 relative flex-1">
            {children}
          </main>
        </div>
      </div>
    </I18nProvider>
  );
};

export default Layout;
