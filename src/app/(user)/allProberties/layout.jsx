import Header from "./_components/Header";

const layout = ({ children }) => {
  return (
    <div>
      <Header />
      <main className="mt-20">{children}</main>
    </div>
  );
};

export default layout;
