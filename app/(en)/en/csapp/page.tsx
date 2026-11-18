import { HomeView } from "@/components/csapp/HomeView";
import { loadCsappIndex } from "@/lib/csapp/content";
export const metadata = { title: "CSAPP · The life of a program" };
export default function Page() { return <HomeView index={loadCsappIndex()} />; }
