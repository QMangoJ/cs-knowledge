import Link from "next/link";
import { t } from "@/i18n";
export default function NotFound() {
  return <div className="home"><h1>404 · {t.notFound}</h1><p><Link href="/">{t.home}</Link></p></div>;
}
