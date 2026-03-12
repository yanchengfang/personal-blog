/* eslint-disable jsx-a11y/anchor-has-content */
import { Link } from "@/i18n/routing";
import type { ComponentProps } from "react";

const CustomLink = ({
  href,
  ...rest
}: ComponentProps<typeof Link>) => {
  const isInternalLink = href && href.startsWith("/");
  const isAnchorLink = href && href.startsWith("#");

  if (isInternalLink) {
    return <Link className="break-words" href={href} {...rest} />;
  }

  if (isAnchorLink) {
    return <a className="break-words" href={href} {...rest} />;
  }

  return (
    <a
      className="break-words"
      target="_blank"
      rel="noopener noreferrer"
      href={href as string}
      {...rest}
    />
  );
};

export default CustomLink;
