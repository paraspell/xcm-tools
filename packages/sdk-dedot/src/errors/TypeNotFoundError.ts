export class TypeNotFoundError extends Error {
  constructor(name: string) {
    super(`Cannot find type by name: ${name}`);
    this.name = "TypeNotFoundError";
  }
}
