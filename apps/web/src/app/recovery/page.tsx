import type { Metadata } from "next";
import { WEB_ROUTE_METADATA } from "../seo-metadata";
import { RecoveryClient } from "./recovery-client";

export const metadata: Metadata = {
  title: WEB_ROUTE_METADATA.recovery.title,
  description: WEB_ROUTE_METADATA.recovery.description,
};

export default function RecoveryPage() {
  return <RecoveryClient />;
}
