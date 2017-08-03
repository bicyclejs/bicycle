export default {
  name: 'id',
  baseType: 'string',
  validate(value: string): boolean {
    // validate that it matches the format of the values returned by uuid()
    return /^[a-f0-9]{8}\-[a-f0-9]{4}\-[a-f0-9]{4}\-[a-f0-9]{4}\-[a-f0-9]{12}$/.test(
      value,
    );
  },
};
