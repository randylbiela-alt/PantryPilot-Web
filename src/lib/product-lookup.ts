export type ProductLookupResult = {
  barcode: string;
  found: boolean;
  name: string;
  brand: string | null;
  category: string | null;
  quantity: string | null;
  imageUrl: string | null;
  source: "Open Food Facts";
};

export async function lookupProduct(barcode: string): Promise<ProductLookupResult> {
  const normalized = barcode.replace(/\D/g, "");
  if (!normalized) throw new Error("Enter a valid barcode number.");
  const response = await fetch(`/api/product-lookup/${encodeURIComponent(normalized)}`, { cache: "no-store" });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body?.error?.message ?? "Product lookup failed.");
  return body as ProductLookupResult;
}
