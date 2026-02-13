"use client";

import { Armchair, UtensilsCrossed, Shirt, Lightbulb } from "lucide-react";
import {
  Header,
  HeroSection,
  CategoryCard,
  CategorySection,
  FeaturedCollection,
  ProductGrid,
  Footer,
  type Product,
  NewArrivalsSlider,
} from "@/components/storefront";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const heroSlides = useQuery(api.heroSlides.listActive);
  const categories = useQuery(api.categories.list);
  const newArrivals = useQuery(api.products.getNewArrivals, { limit: 10 });

  const handleLoadMore = () => {
    router.push("/shop?sort=newest");
  };

  // Map Convex products to UI Product interface
  const mapProduct = (p: any): Product => ({
    id: p._id,
    name: p.name,
    category: p.categoryName || "Collection",
    price: p.basePrice / 100,
    originalPrice: p.compareAtPrice ? p.compareAtPrice / 100 : undefined,
    image: p.featuredImage || p.images[0]?.url,
    badge: p.compareAtPrice ? "sale" : "new",
    slug: p.slug,
    defaultVariantId: p.defaultVariantId,
    rating: p.rating,
    reviewCount: p.reviewCount,
  });

  const products = newArrivals?.map(mapProduct) || [];

  // Resolve slides
  const mainHero = heroSlides?.find(s => !s.location || s.location === 'hero');
  const featuredBanner = heroSlides?.find(s => s.location === 'featured');

  return (
    <>
      <Header />

      <main className="grow w-full max-w-[1440px] mx-auto px-4 md:px-8 lg:px-12 xl:px-40 flex flex-col gap-10 sm:gap-12 pb-16 sm:pb-20">
        {/* Hero Section */}
        {mainHero ? (
          <HeroSection
            title={mainHero.title}
            description={mainHero.description || ""}
            backgroundImage={mainHero.imageUrl}
            primaryCta={{ text: mainHero.ctaText, href: mainHero.ctaHref }}
            secondaryCta={{ text: "Shop All", href: "/shop" }}
          />
        ) : (
          <HeroSection
            badge="Spring Collection 2024"
            title="Embrace the"
            highlight="Warmth of Home"
            description="Curated styles for a cozy, modern life. Discover our new season essentials designed to bring comfort to every corner."
            backgroundImage="https://lh3.googleusercontent.com/aida-public/AB6AXuA2IpFYVg9Mse2Quc7QREUio3Rxro2JrTWecFYedE4huMJVcURS66YEiUyc8pUq1Zd2J1kYyxZBj5WQ52_Eazu7pq8P_N6CZrLByjFw2J7SNSjHOl8uYSs8G3n4VbtcrI7HWm0305jWbpaU5SyMyhTAP_COX3hU5MKsMk_PybI6S7gaFeUjXIFBXvW6oPrth4B14GdsDr6ib4fxL4In2quVuzs2Q53u9WadUc-oJhWUPki8LTJDXgDGEWa0NrRlI3hugBtx-ubv0o8"
            primaryCta={{ text: "Shop Collection", href: "/shop" }}
            secondaryCta={{ text: "View Lookbook", href: "/lookbook" }}
          />
        )}

        {/* Categories Section */}
        <CategorySection title="Shop by Category" viewAllHref="/shop">
          {categories ? categories.map((cat) => (
            <CategoryCard
              key={cat._id}
              href={`/shop?category=${cat.slug}`}
              icon={Armchair} // Fallback icon
              imageUrl={cat.imageUrl}
              title={cat.name}
              subtitle={cat.description || "Collection"}
            />
          )) : (
            // Skeleton loading state could go here, for now keeping static as fallback or empty
            <>
              <CategoryCard
                href="/category/living"
                icon={Armchair}
                title="Living"
                subtitle="Sofas, Chairs & Tables"
              />
              <CategoryCard
                href="/category/dining"
                icon={UtensilsCrossed}
                title="Dining"
                subtitle="Tables & Dinnerware"
              />
            </>
          )}
        </CategorySection>

        {/* Featured Collection Banner */}
        {featuredBanner && (
          <FeaturedCollection
            badge="Featured Collection"
            title={featuredBanner.title}
            description={featuredBanner.description || ""}
            backgroundImage={featuredBanner.imageUrl}
            ctaText={featuredBanner.ctaText}
            ctaHref={featuredBanner.ctaHref}
          />
        )}

        {/* Featured Products Grid (replacing static banner if no banner, or adding below?) 
            User asked for "Featured Collection" (singular) dynamic.
            I will show Featured Products Grid regardless, maybe?
            Actually, the request was "make ... Featured Collection ... dynamic". 
            I'll stick to the banner being dynamic via heroSlides(location='featured').
        */}

        {/* New Arrivals Slider */}
        <NewArrivalsSlider
          title="New Arrivals"
          products={products}
          onLoadMore={handleLoadMore}
        />
      </main>

      <Footer />
    </>
  );
}
