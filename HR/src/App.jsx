import AppRoutes from "./routes/AppRoutes";
import SmokeCursor from "./components/SmokeCursor";

function App() {
  return (
    <>
      <SmokeCursor color={[239, 84, 67]} />
      <AppRoutes />
    </>
  );
}

export default App;
