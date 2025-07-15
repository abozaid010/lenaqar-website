import Header from "./_components/Header";

const layout = ({ children }) => {
  return (
    <>
      <Header />
      <main className="mt-20">{children}</main>
    </>
  );
};

export default layout;
