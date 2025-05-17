export default async function ClientPage({ params }) {
  const { clientID } = await params;
  return (
    <div>
      <h1>Client Page - {clientID}</h1>
      <p>This is the client page.</p>
    </div>
  );
}
