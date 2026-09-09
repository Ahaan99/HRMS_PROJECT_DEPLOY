import AppRoutes from "./routes/AppRoutes";
import SmokeCursor from "./components/SmokeCursor";

export default function App() {
  return <>
  <SmokeCursor color={[233, 84, 63]} />
  <AppRoutes />
  </>
}
