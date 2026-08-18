import type { Metadata } from "next";
import { WEB_ROUTE_METADATA } from "../seo-metadata";
import { UpdateClient } from "./update-client";

export const metadata: Metadata = {
  title: WEB_ROUTE_METADATA.update.title,
  description: WEB_ROUTE_METADATA.update.description,
};

export default function UpdatePage() {
  return <UpdateClient />;
}
