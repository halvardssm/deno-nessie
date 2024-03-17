// Code inspired by https://stackoverflow.com/a/67230709
export class NessieError extends Error {
  constructor(message: string) {
    super(message);

    // needed for CustomError instanceof Error => true
    Object.setPrototypeOf(this, new.target.prototype);

    // Set the name
    this.name = this.constructor.name;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}
