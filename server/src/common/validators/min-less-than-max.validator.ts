import {
  ValidationArguments,
  ValidationOptions,
  registerDecorator,
} from 'class-validator';

// Class-level cross-field validator: registers against `minField` so the
// error surfaces attached to that property, but reads both fields off the
// object being validated.
export function MinLessThanMax(
  minField: string,
  maxField: string,
  validationOptions?: ValidationOptions,
) {
  return function (constructor: NewableFunction): void {
    registerDecorator({
      name: 'minLessThanMax',
      target: constructor,
      propertyName: minField,
      options: validationOptions,
      validator: {
        validate(_value: unknown, args: ValidationArguments): boolean {
          const object = args.object as Record<string, unknown>;
          const min = object[minField];
          const max = object[maxField];
          if (min === undefined || max === undefined) return true;
          return Number(min) <= Number(max);
        },
        defaultMessage(): string {
          return `${minField} must be less than or equal to ${maxField}`;
        },
      },
    });
  };
}
