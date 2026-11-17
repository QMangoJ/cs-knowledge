import Link from "next/link";
import { stringsFor } from "@/i18n";
const s = stringsFor("zh");
export default function NotFound() {
  return <div className="home"><h1>404 · {s.notFound}</h1><p><Link href="/">{s.home}</Link></p></div>;
}
