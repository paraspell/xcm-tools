import { Route, Routes as ReactRouterRoutes } from "react-router";

import HomePage from "../routes/HomePage";
import NotFoundPage from "../routes/NotFoundPage";

const Routes = () => (
  <ReactRouterRoutes>
    <Route path="/" element={<HomePage />} />
    <Route path="*" element={<NotFoundPage />} />
  </ReactRouterRoutes>
);

export default Routes;
