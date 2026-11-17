import Link from "next/link";
import { stringsFor } from "@/i18n";
const s = stringsFor("en");
export default function NotFound() {
  return <div className="home"><h1>404 · {s.notFound}</h1><p><Link href="/en/">{s.home}</Link></p></div>;
}
