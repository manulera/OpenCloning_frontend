export default function error2String(error) {
  if (error.code === 'ERR_NETWORK') { return 'Cannot connect to backend server'; }
  if (!error.code) {
    return error.message;
  }
  const { detail } = error.response.data;
  if (error.response.status === 500) return 'Internal server error';
  if (typeof detail === 'string') {
    return detail;
  } if (typeof detail === 'object') {
    const detail2 = detail.map((d) => {
      const { input, ...rest } = d;
      return rest;
    });
    return `Server error message:\n${JSON.stringify(detail2, null, 2)}`;
  }
  return '';
}
