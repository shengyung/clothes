import type { Metadata } from "next";
import SizeGuideClient from "@/components/SizeGuideClient";

export const metadata: Metadata = {
  title: "尺寸指南 — ShapeOnYou",
  description: "輸入身體數據，找到最適合你的尺寸",
};

export default function SizeGuidePage() {
  return <SizeGuideClient />;
}
