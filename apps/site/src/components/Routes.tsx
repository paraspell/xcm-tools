import { Route, Routes as ReactRouterRoutes } from "react-router";

import { HomePage } from "../routes/HomePage";
import { NotFound } from "./NotFound/NotFound";

export const Routes = () => (
  <ReactRouterRoutes>
    <Route path="/" element={<HomePage />} />
    <Route path="*" element={<NotFound />} />
  </ReactRouterRoutes>
);
