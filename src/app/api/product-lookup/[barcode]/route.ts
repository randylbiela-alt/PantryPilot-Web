import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type OffProduct = {
  product_name?: string;
  product_name_en?: string;
  generic_name?: string;
  brands?: string;
  categories?: string;
  categories_tags?: string[];
  quantity?: string;
  image_front_small_url?: string;
  image_url?: string;
};

type OffResponse = {
  code?: string;
  status?: number;
  product?: OffProduct;
};

function category(product: OffProduct): string | null {
  if (product.categories?.trim()) return product.categories.split(",")[0]?.trim() || null;
  const tag = product.categories_tags?.[0];
  return tag ? tag.replace(/^[a-z]{2}:/, "").replace(/-/g, " ") : null;
}

export async function GET(_request: Request, context: { params: Promise<{ barcode: string }> }) {
  const { barcode } = await context.params;
  const normalized = barcode.replace(/\D/g, "");
  if (!/^\d{6,14}$/.test(normalized)) {
    return NextResponse.json({ error: { code: "INVALID_BARCODE", message: "Barcode must contain 6 to 14 digits." } }, { status: 400 });
  }

  const url = new URL(`https://world.openfoodfacts.org/api/v3/product/${normalized}`);
  url.searchParams.set("fields", "code,product_name,product_name_en,generic_name,brands,categories,categories_tags,quantity,image_front_small_url,image_url");
  url.searchParams.set("lc", "en");
  url.searchParams.set("cc", "us");

  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "PantryPilot/3.2 (product lookup)" },
      next: { revalidate: 86400 }
    });
    if (response.status === 404) {
      return NextResponse.json({ barcode: normalized, found: false, name: `Barcode ${normalized}`, brand: null, category: null, quantity: null, imageUrl: null, source: "Open Food Facts" });
    }
    if (!response.ok) {
      return NextResponse.json({ error: { code: "PRODUCT_LOOKUP_UNAVAILABLE", message: "Product lookup is temporarily unavailable." } }, { status: 502 });
    }
    const body = await response.json() as OffResponse;
    const product = body.product;
    if (!product || body.status === 0) {
      return NextResponse.json({ barcode: normalized, found: false, name: `Barcode ${normalized}`, brand: null, category: null, quantity: null, imageUrl: null, source: "Open Food Facts" });
    }
    const name = product.product_name_en?.trim() || product.product_name?.trim() || product.generic_name?.trim() || `Barcode ${normalized}`;
    return NextResponse.json({
      barcode: normalized,
      found: true,
      name,
      brand: product.brands?.split(",")[0]?.trim() || null,
      category: category(product),
      quantity: product.quantity?.trim() || null,
      imageUrl: product.image_front_small_url || product.image_url || null,
      source: "Open Food Facts"
    });
  } catch {
    return NextResponse.json({ error: { code: "PRODUCT_LOOKUP_UNAVAILABLE", message: "Product lookup is temporarily unavailable." } }, { status: 502 });
  }
}
