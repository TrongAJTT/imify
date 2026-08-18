import type { Metadata } from "next";
import { WEB_ROUTE_METADATA } from "../seo-metadata";
import { UpdateClient } from "./update-client";

export const metadata: Metadata = WEB_ROUTE_METADATA.update;

export default function UpdatePage() {
  return <UpdateClient />;
}
