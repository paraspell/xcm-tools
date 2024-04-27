import { useContext } from "react";
import { ThemeContext } from "../providers/ThemeContext";

export const useWallet = () => useContext(ThemeContext);
