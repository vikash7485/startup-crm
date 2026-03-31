export const successResponse = (res, data, status = 200) => {
  return res.status(status).json({
    success: true,
    data,
    timestamp: new Date().toISOString(),
    status
  });
};

export const errorResponse = (res, message, status = 400, code = "ERROR", details = null) => {
  const response = {
    success: false,
    error: { message, code },
    timestamp: new Date().toISOString(),
    status
  };
  if (details) response.error.details = details;
  return res.status(status).json(response);
};

export const paginatedResponse = (res, items, pagination, status = 200) => {
  return res.status(status).json({
    success: true,
    data: { items, pagination },
    timestamp: new Date().toISOString(),
    status
  });
};
