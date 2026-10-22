import { Fragment } from "react";

const URL_PATTERN = /(https?:\/\/[^\s]+)/g;

/** Plain text with its web addresses turned into links (chat messages). Keeps line breaks. */
export function LinkifiedText({ text, linkClassName }: { text: string; linkClassName?: string }) {
  return (
    <>
      {text.split(URL_PATTERN).map((part, i) => {
        if (i % 2 === 0) return <Fragment key={i}>{part}</Fragment>;
        // Leave a trailing full stop or bracket out of the link.
        const url = part.replace(/[.,!?)\]]+$/, "");
        // Long links (e.g. Google Maps directions) show just the site name.
        const shown = url.replace(/^https?:\/\/(www\.)?/, "");
        return (
          <Fragment key={i}>
            <a href={url} target="_blank" rel="noopener noreferrer" className={linkClassName ?? "font-semibold underline underline-offset-2"}>
              {shown.length > 40 ? `${shown.split(/[/?#]/)[0]}/…` : shown}
            </a>
            {part.slice(url.length)}
          </Fragment>
        );
      })}
    </>
  );
}
