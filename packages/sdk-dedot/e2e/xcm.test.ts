import type { TDedotSigner } from "../src";
import { Builder, SUBSTRATE_CHAINS } from "../src";
import { generateE2eTests } from "../../sdk-core/e2e";
import { validateTx } from "./utils";

generateE2eTests(Builder, createSigners(), validateTx, [...SUBSTRATE_CHAINS]);
