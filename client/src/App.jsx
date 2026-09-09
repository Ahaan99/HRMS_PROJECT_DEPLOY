import { BrowserRouter } from "react-router-dom";
import ClientRoutes from "./routes/ClientRoutes";
import { ClientAuthProvider } from "./context/ClientAuthContext";
import SmokeCursor from "./components/SmokeCursor";

function App() {
  return (
    <BrowserRouter>
      <ClientAuthProvider>
        <SmokeCursor color={[263, 83, 62]} />
        <ClientRoutes />
      </ClientAuthProvider>
    </BrowserRouter>
  );
}

export default App;
