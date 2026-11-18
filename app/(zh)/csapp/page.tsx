import type { Metadata } from "next";
import { loadCsappIndex } from "@/lib/csapp/content";
import { HomeView } from "@/components/csapp/HomeView";

export const metadata: Metadata = {
  title: "CSAPP · 一个程序的一生",
  description: "12 章系统笔记：从比特到并发，带自测与系统地图。",
};

export default function Page() {
  return <HomeView index={loadCsappIndex()} />;
}
