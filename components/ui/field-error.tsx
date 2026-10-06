export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="mt-1 text-sm text-warn-red" role="alert">
      {message}
    </p>
  );
}
