"use client";

import type { ComponentPropsWithoutRef } from "react";
import { track } from "@vercel/analytics";

type TrackedOutboundLinkProps = ComponentPropsWithoutRef<"a"> & {
  destination: "github" | "npm";
  placement: "final" | "footer" | "header" | "hero";
};

export function TrackedOutboundLink({
  destination,
  onClick,
  placement,
  ...props
}: TrackedOutboundLinkProps) {
  return (
    <a
      {...props}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) {
          track("outbound_cta_clicked", { destination, placement });
        }
      }}
    />
  );
}
