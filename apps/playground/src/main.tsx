import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import WalletProvider from "./providers/WalletProvider";

(BigInt.prototype as unknown as { toJSON: () => string }).toJSON = function (
  this: bigint
) {
  return this.toString();
};

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <WalletProvider>
      <App />
    </WalletProvider>
  </React.StrictMode>
);
