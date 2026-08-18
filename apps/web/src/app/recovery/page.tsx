import type { Metadata } from "next";
import { WEB_ROUTE_METADATA } from "../seo-metadata";
import { RecoveryClient } from "./recovery-client";

export const metadata: Metadata = WEB_ROUTE_METADATA.recovery;

export default function RecoveryPage() {
  return <RecoveryClient />;
}
