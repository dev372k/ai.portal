export const successResponse = (res, data = null, message = 'Success', code = 200) => {
  res.status(code).json({
    success: true,
    message,
    data,
  });
};

export const errorResponse = (res, message = 'Something went wrong', code = 500, errors = null) => {
  res.status(code).json({
    success: false,
    message,
    errors,
  });
};
