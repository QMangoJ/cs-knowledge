import { PROBLEMS } from "@/lib/coding/problems";
import { CodingProblemPage, codingProblemMetadata } from "@/lib/codingPages";

export const dynamicParams = false;
export function generateStaticParams() { return PROBLEMS.map((p) => ({ slug: p.slug })); }
type P = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: P) {
  const { slug } = await params;
  return codingProblemMetadata(slug, "en");
}
export default async function Page({ params }: P) {
  const { slug } = await params;
  return <CodingProblemPage slug={slug} lang="en" />;
}
