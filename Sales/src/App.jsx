import AppRoutes from "./routes/AppRoutes";
import SmokeCursor from "./components/SmokeCursor";

export default function App() {
  return (
    <>
      <SmokeCursor color={[239, 84, 67]} />
      <AppRoutes />
    </>
  );
}
