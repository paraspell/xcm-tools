import { Route, Routes as ReactRouterRoutes } from "react-router";

import { HomePage } from "../routes/HomePage";
import { NotFoundPage } from "../routes/NotFoundPage";

export const Routes = () => (
  <ReactRouterRoutes>
    <Route path="/" element={<HomePage />} />
    <Route path="*" element={<NotFoundPage />} />
  </ReactRouterRoutes>
);
