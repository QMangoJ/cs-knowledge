import { PROBLEMS } from "@/lib/coding/problems";
import { CodingIndex } from "@/components/coding/CodingIndex";
export const metadata = { title: "面试刷题 · 计算机科学", description: "Codility 风格练习与模拟考：浏览器内写代码、跑测试、看参考解法。" };
export default function Page() { return <CodingIndex problems={PROBLEMS} />; }
