module.exports = {
  extends: "forbeslindesay",
  env: {
    jest: true,
  },
  rules: {
    'no-unused-vars': [0],
    'no-invalid-this': [0],
    // handled by flow:
    'no-undef': [0],
  },
};
