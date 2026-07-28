import { ParaSpellError } from "@paraspell/sdk-common";

export class TypeNotFoundError extends ParaSpellError {
  constructor(name: string) {
    super(`Cannot find type by name: ${name}`);
  }
}
