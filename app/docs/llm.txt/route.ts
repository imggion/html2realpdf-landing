import { llms } from "fumadocs-core/source";
import { docsSource } from "@/lib/docs-source";

export const revalidate = false;

export function GET() {
  return new Response(llms(docsSource).index(), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
