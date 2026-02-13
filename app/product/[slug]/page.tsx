import { Metadata } from "next";
import { ProductPageClient } from "@/components/storefront/ProductPageClient";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

interface PageProps {
    params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { slug } = await params;
    const product = await client.query(api.products.getBySlug, { slug });

    if (!product) {
        return {
            title: "Product Not Found",
            description: "The product you are looking for does not exist.",
        };
    }

    return {
        title: product.metaTitle || product.name,
        description: product.metaDescription || product.description,
        keywords: product.tags,
        openGraph: {
            title: product.metaTitle || product.name,
            description: product.metaDescription || product.description,
            images: [
                {
                    url: product.featuredImage || product.images[0]?.url || "",
                    width: 800,
                    height: 600,
                    alt: product.name,
                },
            ],
        },
    };
}

export default async function ProductPage({ params }: PageProps) {
    const { slug } = await params;
    return <ProductPageClient slug={slug} />;
}
