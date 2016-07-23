export default {
  name: 'id',
  validate(value) {
    // validate that it matches the format of the values returned by uuid()
    if (!/^[a-f0-9]{8}\-[a-f0-9]{4}\-[a-f0-9]{4}\-[a-f0-9]{4}\-[a-f0-9]{12}$/.test(value)) {
      throw new Error('Invalid id');
    }
  },
};
