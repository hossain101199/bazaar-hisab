interface ApiError {
  message: string;
  status: number;
  code?: string;
}

interface ApiResponseData {
  message?: string;
  error?: string;
  code?: string;
}

interface AxiosLikeError {
  response?: {
    status: number;
    data?: ApiResponseData;
  };
}

function isAxiosLikeError(err: unknown): err is AxiosLikeError {
  return (
    err !== null &&
    typeof err === "object" &&
    "response" in err
  );
}

export function extractErrorMessage(err: unknown): ApiError {
  if (isAxiosLikeError(err)) {
    const status = err.response?.status ?? 500;
    const data = err.response?.data;

    if (data && typeof data === "object") {
      const message = data.message ?? data.error ?? "একটি ত্রুটি ঘটেছে";
      return { message, status, code: data.code };
    }

    const defaultMessages: Record<number, string> = {
      400: "অনুরোধ ত্রুটি",
      401: "প্রমাণীকরণ ব্যর্থ হয়েছে",
      403: "অনুমতি অস্বীকৃত",
      404: "সম্পদ পাওয়া যায়নি",
      409: "সংঘর্ষ: আইটেম ইতিমধ্যে বিদ্যমান",
      429: "অনেক বার চেষ্টা করা হয়েছে, কিছুক্ষণ পর আবার চেষ্টা করুন",
      500: "সার্ভার ত্রুটি",
      503: "সেবা উপলব্ধ নয়",
    };

    return {
      message: defaultMessages[status] ?? "একটি অপ্রত্যাশিত ত্রুটি ঘটেছে",
      status,
    };
  }

  if (typeof err === "string") return { message: err, status: 500 };
  if (err instanceof Error) return { message: err.message, status: 500 };

  return { message: "একটি অজানা ত্রুটি ঘটেছে", status: 500 };
}

export function isNetworkError(err: unknown): boolean {
  return isAxiosLikeError(err) && !err.response;
}

export function isErrorStatus(err: unknown, status: number): boolean {
  return isAxiosLikeError(err) && err.response?.status === status;
}

export function getErrorMessage(
  code?: string,
  fallback = "একটি ত্রুটি ঘটেছে",
): string {
  const messages: Record<string, string> = {
    P2002: "এই তথ্যটি ইতিমধ্যে বিদ্যমান",
    P2025: "সম্পদ পাওয়া যায়নি",
    P2003: "অবৈধ সম্পর্ক রেফারেন্স",
    INVALID_EMAIL: "অবৈধ ইমেইল ঠিকানা",
    INVALID_PASSWORD: "অবৈধ পাসওয়ার্ড",
    INVALID_DATE: "অবৈধ তারিখ ফরম্যাট",
    INVALID_TOKEN: "অবৈধ বা মেয়াদোত্তীর্ণ টোকেন",
  };

  return messages[code ?? ""] ?? fallback;
}
