import { createHashRouter } from "react-router-dom";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";

const router = createHashRouter([
  { path: "/", element: <Home /> },
  { path: "/dashboard/:owner/:repo", element: <Dashboard /> },
]);

export default router;
