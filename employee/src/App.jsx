import AppRoutes from "./routes/AppRoutes";
import SmokeCursor from "./components/SmokeCursor";

export default function App() {

  return (
    <>
      <SmokeCursor color={[232, 86, 70]} />
      <AppRoutes />
    </>
  )
}
