import { getProfileData } from "@/components/services/serviceFetching";

export default async function ClientPage({ params }) {
  const data = await getProfileData();

  return (
    <div>
      <h1>Client Page </h1>
      <p>This is the client page.</p>
    </div>
  );
}
