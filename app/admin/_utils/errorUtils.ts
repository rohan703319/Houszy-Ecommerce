export function getBackendMessage(input: any): string {
  if (!input) return 'Something went wrong';

  // 🔥 HANDLE AXIOS NETWORK ERROR FIRST (CRITICAL)
  if (input?.code === 'ERR_NETWORK') {
    return 'Network error — unable to reach server';
  }

  if (input?.message === 'Network Error') {
    return 'Network error — request failed before reaching server';
  }

  // Extract data safely
  const data =
    input?.response?.data ||
    input?.data ||
    input;

  // 🔥 ASP.NET VALIDATION ERRORS (OBJECT)
  if (data?.errors && typeof data.errors === 'object' && !Array.isArray(data.errors)) {
    const errorEntries = Object.entries(data.errors);

    if (errorEntries.length > 0) {
      const [field, msgs]: [string, any] = errorEntries[0];
      const msg = Array.isArray(msgs) ? msgs[0] : msgs;

      if (msg) return `${field}: ${msg}`;
    }
  }

  // 🔥 ARRAY ERRORS
  if (Array.isArray(data?.errors) && data.errors.length > 0) {
    return data.errors[0];
  }

  // 🔥 STANDARD FIELDS
  if (data?.message) return data.message;
  if (data?.error) return data.error;
  if (data?.title) return data.title;

  // 🔥 FALLBACKS
  if (input?.message) return input.message;

  return 'Something went wrong';
}



export function getBackendErrors(input: any): string[] {
  if (!input) return ['Something went wrong'];

  // 🔥 HANDLE NETWORK ERROR
  if (input?.code === 'ERR_NETWORK' || input?.message === 'Network Error') {
    return ['Network error — unable to reach server'];
  }

  const data =
    input?.response?.data ||
    input?.data ||
    input;

  // 🔥 ASP.NET VALIDATION ERRORS (OBJECT)
  if (data?.errors && typeof data.errors === 'object' && !Array.isArray(data.errors)) {
    return Object.entries(data.errors).flatMap(([field, msgs]: any) => {
      const messageArray = Array.isArray(msgs) ? msgs : [msgs];
      return messageArray.map((msg: string) => `${field}: ${msg}`);
    });
  }
  // 🔥 ARRAY ERRORS
  if (Array.isArray(data?.errors) && data.errors.length > 0) {
    return data.errors;
  }

  // 🔥 STANDARD FIELDS
  const singleMsg =
    data?.message ||
    data?.error ||
    data?.title ||
    input?.message;

  return singleMsg ? [singleMsg] : ['Something went wrong'];
}