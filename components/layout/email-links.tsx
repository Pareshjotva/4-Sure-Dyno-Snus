import { contactEmails } from "@/lib/site";

export function EmailLinks({
  primary,
  className,
  separator = "line",
}: {
  primary?: string;
  className?: string;
  separator?: "line" | "dot";
}) {
  const emails = contactEmails(primary);

  return (
    <>
      {emails.map((email, index) => (
        <span key={email}>
          {index > 0 && separator === "line" ? <br /> : null}
          {index > 0 && separator === "dot" ? " · " : null}
          <a href={`mailto:${email}`} className={className}>
            {email}
          </a>
        </span>
      ))}
    </>
  );
}