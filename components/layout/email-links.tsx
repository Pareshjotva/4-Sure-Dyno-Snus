import { contactEmails } from "@/lib/site";

export function EmailLinks({
  emails,
  className,
  separator = "line",
}: {
  emails: Array<string | null | undefined>;
  className?: string;
  separator?: "line" | "dot";
}) {
  const list = contactEmails(...emails);

  return (
    <>
      {list.map((email, index) => (
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
