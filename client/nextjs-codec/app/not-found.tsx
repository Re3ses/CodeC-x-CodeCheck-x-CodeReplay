import HttpError from '@/components/ui/HttpError';

export default function NotFound() {
  return <HttpError statusCode={404} />;
}