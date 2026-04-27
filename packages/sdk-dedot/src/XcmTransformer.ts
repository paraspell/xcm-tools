/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { NumberFormatError } from "@paraspell/sdk-core";
import { decodeAddress, isEvmAddress } from "dedot/utils";

import { snakeToCamel } from "./utils";

const isValidSubstrateAddress = (address: string): boolean => {
  try {
    return !!decodeAddress(address);
  } catch {
    return false;
  }
};

export const checkAndConvertToNumberOrBigInt = (input: string) => {
  if (!/^-?\d+$/.test(input)) {
    throw new NumberFormatError("Invalid integer string");
  }

  const bigIntValue = BigInt(input);

  if (
    bigIntValue >= Number.MIN_SAFE_INTEGER &&
    bigIntValue <= Number.MAX_SAFE_INTEGER
  ) {
    return Number(bigIntValue);
  }

  return bigIntValue;
};

export const transform = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map(transform);
  } else if (typeof obj === "object" && obj !== null) {
    const keys = Object.keys(obj);

    if (keys.length === 1) {
      const key = keys[0];
      const value = obj[key];

      if (key === "items" && Array.isArray(value)) {
        return {
          items: value,
        };
      }

      if (key === "AccountId32") {
        return {
          type: key,
          value: {
            network:
              value.network === "any"
                ? {
                    type: "Any",
                  }
                : undefined,
            id: value.id,
          },
        };
      } else if (key === "Id") {
        return {
          type: key,
          value,
        };
      } else if (key === "Substrate") {
        return {
          type: key,
          value,
        };
      } else if (key === "OtherReserve") {
        return {
          type: key,
          value: checkAndConvertToNumberOrBigInt(value),
        };
      } else if (
        key === "GlobalConsensus" &&
        typeof value === "object" &&
        ("polkadot" in value || "kusama" in value)
      ) {
        return {
          type: key,
          value: {
            type: "polkadot" in value ? "Polkadot" : "Kusama",
          },
        };
      } else if (key === "PalletInstance") {
        return {
          type: key,
          value: value,
        };
      } else if (key === "GeneralIndex") {
        return {
          type: key,
          value: BigInt(value),
        };
      } else if (key === "Ethereum") {
        return {
          type: key,
          value: {
            chainId: value.chainId,
          },
        };
      } else if (key === "AccountKey20") {
        return {
          type: key,
          value: {
            network:
              value.network === "any"
                ? {
                    type: "Any",
                  }
                : undefined,
            key: value.key,
          },
        };
      } else if (key === "SetFeesMode") {
        return {
          type: key,
          value: {
            jitWithdraw: value.jit_withdraw ?? false,
          },
        };
      } else if (key === "PayFees") {
        return {
          type: key,
          value: {
            asset: transform(value.asset),
          },
        };
      } else if (key === "X1" && Array.isArray(value)) {
        return {
          type: key,
          value: value.map(transform),
        };
      } else if (key === "Fungible") {
        return {
          type: key,
          value: value,
        };
      } else if (typeof value === "string" && !value.startsWith("0x")) {
        return {
          type: key,
          value: {
            type: value,
          },
        };
      } else if (typeof value === "number") {
        return {
          type: key,
          value: value,
        };
      } else {
        return {
          type: key,
          value: transform(value),
        };
      }
    } else {
      const newObj: any = {};
      for (const key of keys) {
        const v = obj[key];
        const k = snakeToCamel(key);

        if (key === "call") {
          newObj[k] = v;
          continue;
        }

        if (key === "fee_item") {
          newObj[k] = Number(v);
          continue;
        }

        if (key === "currency_id" && typeof v === "string") {
          try {
            newObj[k] = checkAndConvertToNumberOrBigInt(v);
          } catch (_e) {
            newObj[k] = {
              type: v,
            };
          }
        }

        if (k === "amount" && typeof v === "string") {
          try {
            newObj[k] = BigInt(v);
          } catch (_e) {
            newObj[k] = {
              type: v,
            };
          }
          continue;
        }

        if (key === "dest_weight" && v === null) {
          newObj[k] = undefined;
          continue;
        }

        if (typeof v === "string" && isValidSubstrateAddress(v)) {
          newObj[k] = v;
          continue;
        }

        const noTypeKeys = ["fun", "originKind"];

        if (noTypeKeys.includes(k) && typeof v === "string") {
          newObj[k] = v;
          continue;
        }

        if (typeof v === "string" && isEvmAddress(v)) {
          newObj[k] = v;
        } else if (typeof v === "string" && v.startsWith("0x")) {
          newObj[k] = v;
        } else if (typeof v === "string") {
          newObj[k] = {
            type: v,
          };
        } else {
          newObj[k] = transform(v);
        }
      }
      return newObj;
    }
  } else {
    // For primitive values
    return obj;
  }
};
