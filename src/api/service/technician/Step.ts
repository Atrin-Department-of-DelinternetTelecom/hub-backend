export type CheckerFn = () => true | string | Promise<true | string>;

export type StepCheckResult = {
  name: string;
  result: true | string; // string for error message
};

export class Step {
  name: string;
  check: CheckerFn;
  optional = false;
  constructor(
    name: string,
    options: {
      check?: CheckerFn;
      optional?: boolean;
    } = {},
  ) {
    this.name = name;
    this.check = options.check ?? (() => true);
    if (options.optional) this.optional = true;
  }
}

export class StepValidationError extends Error {
  step: string;
  constructor(step: string, message: string) {
    super(message);
    this.step = step;
  }
}
