import { ItemDetail } from "@/components/views/ItemDetail";

export default async function ItemPage({ params }: { params: Promise<{ type: string; id: string }> }) {
  const { id } = await params;
  return <ItemDetail id={id} />;
}
