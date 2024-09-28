import { Routes as ReactRouterRoutes, Route } from "react-router-dom";
import HomePage from "../routes/HomePage";
import NotFoundPage from "../routes/NotFoundPage";

const Routes = () => (
  <ReactRouterRoutes>
    <Route path="/" element={<HomePage />} />
    <Route path="*" element={<NotFoundPage />} />
  </ReactRouterRoutes>
);

export default Routes;
