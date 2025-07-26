// Product lookup service using Open Food Facts API
export interface ProductInfo {
  name: string
  brand?: string
  category?: string
  image?: string
  found: boolean
}

export async function lookupProduct(barcode: string): Promise<ProductInfo> {
  try {
    // Try Open Food Facts first (free, comprehensive food database)
    const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`)
    const data = await response.json()

    if (data.status === 1 && data.product) {
      const product = data.product
      return {
        name: product.product_name || product.product_name_en || `Product ${barcode}`,
        brand: product.brands,
        category: product.categories_tags?.[0]?.replace("en:", ""),
        image: product.image_url,
        found: true,
      }
    }

    // Fallback: try UPC database
    const upcResponse = await fetch(`https://api.upcitemdb.com/prod/trial/lookup?upc=${barcode}`)
    const upcData = await upcResponse.json()

    if (upcData.code === "OK" && upcData.items?.length > 0) {
      const item = upcData.items[0]
      return {
        name: item.title || `Product ${barcode}`,
        brand: item.brand,
        category: item.category,
        image: item.images?.[0],
        found: true,
      }
    }

    // No product found
    return {
      name: `Unknown Product (${barcode})`,
      found: false,
    }
  } catch (error) {
    console.error("Product lookup error:", error)
    return {
      name: `Product ${barcode}`,
      found: false,
    }
  }
}
