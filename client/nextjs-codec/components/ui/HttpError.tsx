import Image from 'next/image';
import Link from 'next/link';

type ErrorDefinition = {
  title: string;
  message: string;
  showReset?: boolean;
  showHome?: boolean;
};

const HTTP_ERRORS: Record<number, ErrorDefinition> = {
  400: {
    title: 'Bad Request',
    message: 'The request was malformed or contains invalid parameters.',
    showHome: true
  },
  401: {
    title: 'Unauthorized',
    message: 'You need to be logged in to access this resource.',
    showHome: true
  },
  403: {
    title: 'Forbidden',
    message: 'You don\'t have permission to access this resource.',
    showHome: true
  },
  404: {
    title: 'Page Not Found',
    message: 'The page you\'re looking for might have taken a catnap.',
    showHome: true
  },
  500: {
    title: 'Internal Server Error',
    message: 'Our cat seems to have knocked something over.',
    showReset: true
  },
  502: {
    title: 'Bad Gateway',
    message: 'The server received an invalid response.',
    showReset: true
  },
  503: {
    title: 'Service Unavailable',
    message: 'Our service is taking a cat nap. Please try again later.',
    showReset: true
  }
};

interface HttpErrorProps {
  statusCode: number;
  reset?: () => void;
  showHome?: boolean;
  message?: string;
}

export default function HttpError({ statusCode, message, reset, showHome }: HttpErrorProps) {
  const error = HTTP_ERRORS[statusCode] || {
    title: statusCode || 'Unknown Error',
    message: message || 'Something unexpected happened.',
    showReset: true,
    showHome: showHome || true
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white p-4">
      <div className="relative w-[400px] h-[400px] mb-8">
        <Image
          src={`https://http.cat/${statusCode}`}
          alt={`${statusCode} Cat`}
          fill
          className="rounded-lg object-contain"
          priority
        />
      </div>
      <h2 className="text-2xl mt-4 mb-4 font-bold text-[#FFD700]">
        {error.title}
      </h2>
      <p className="text-gray-400 mb-8 text-center">
        {error.message}
      </p>
      <div className="flex gap-4">
        {error.showReset && reset && (
          <button
            onClick={reset}
            className="px-6 py-3 bg-[#FFD700] text-black rounded-lg hover:bg-[#FFD700]/90 transition-colors"
          >
            Try again
          </button>
        )}
        <Link
          href="/dashboard"
          className="px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          Return Home
        </Link>
      </div>
    </div>
  );
}