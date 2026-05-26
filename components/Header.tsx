"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { Menu, Search, Heart, ShoppingBag, User, X, ChevronDown, ChevronRight, Truck, Package, Bike, Star, BadgePercent, GiftIcon, TruckElectric, FastForward, Zap, MapPin, Store, LucideBike, BikeIcon, Mouse, MousePointer, MousePointer2, MousePointerClickIcon } from "lucide-react";
import MegaMenu from "./MegaMenu";
import { useToast } from "@/components/toast/CustomToast";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useDebounce } from "@/app/hooks/useDebounce";
import { usePathname } from "next/navigation";
import {
  getDiscountBadge,
  getDiscountedPrice,
} from "@/app/lib/discountHelpers";
import { flattenProductsForListing } from "@/app/lib/flattenProductsForListing";
import { getOldPriceDiscount } from "@/utils/pricing";
const iconMap: Record<string, any> = {
  Zap: Zap,
  Truck: Truck,
  MousePointerClickIcon: MousePointerClickIcon,
  BikeIcon: BikeIcon,
};
interface Category {
  id: string;
  name: string;
  slug: string;
  parentCategoryId?: string | null;
  subCategories?: Category[];
}
export default function Header({
  ssrCategories = [],
  deliveryStrip = [],
  className = "",
}: {
  ssrCategories?: Category[];
  deliveryStrip?: any[];
  className?: string;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [blogCategories, setBlogCategories] = useState<any[]>([]);
  const [blogsHovered, setBlogsHovered] = useState(false);
  const [mobileBlogsOpen, setMobileBlogsOpen] = useState(false);
  const [categories] = useState<Category[]>(
    (ssrCategories || [])
      .filter((c: any) => !c.parentCategoryId)
      .filter((c: any) => c.showOnHomepage === true)
      .sort((a: any, b: any) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
  );

  // Mobile drawer shows ALL parent categories (not just homepage ones)
  const [mobileCategories] = useState<Category[]>(
    (ssrCategories || [])
      .filter((c: any) => !c.parentCategoryId)
      .filter((c: any) => c.showOnHomepage === true)
      .sort((a: any, b: any) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
  );

  const [activeCategory, setActiveCategory] = useState<Category | null>(null);
  const [hovered, setHovered] = useState(false);
  const [hideTopBar, setHideTopBar] = useState(false);

  const lastScroll = useRef(0);
  const megaWrapperRef = useRef<HTMLDivElement>(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const toast = useToast();
  const { cartCount, isInitialized } = useCart();
  const { wishlistCount } = useWishlist();
  const router = useRouter();
  const { isAuthenticated, user, logout } = useAuth();


  const handleAccountClick = () => {
    router.push("/account");
  };


  const mobileTopMessages = deliveryStrip.map((item) => {
    const Icon = iconMap[item.icon] || Truck;

    return {
      icon: <Icon size={20} />,
      title: item.title,
      subtitle: item.subtitle,
      link: `/delivery/${item.slug}`,
    };
  });
  const renderStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const hasHalf = rating % 1 >= 0.5;

    return (
      <div className="flex items-center gap-0.5">
        {[...Array(5)].map((_, i) => {
          if (i < fullStars) {
            return <Star key={i} size={12} className="fill-yellow-400 text-yellow-400" />;
          }
          if (i === fullStars && hasHalf) {
            return <Star key={i} size={12} className="fill-yellow-400/50 text-yellow-400" />;
          }
          return <Star key={i} size={12} className="text-gray-300" />;
        })}
      </div>
    );
  };



  const pathname = usePathname();
  useEffect(() => {
    // Route change hua â†’ MegaMenu band
    setHovered(false);
    setActiveCategory(null);
  }, [pathname]);

  const [currentMsg, setCurrentMsg] = useState(0);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    // Fetch blog categories dynamically
    const fetchBlogCategories = async () => {
      try {
        const res = await fetch("/api/BlogCategories");
        const json = await res.json();
        if (json?.success && Array.isArray(json.data)) {
          const activeCats = json.data
            .filter((c: any) => c.isActive && !c.isDeleted)
            .sort((a: any, b: any) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
          setBlogCategories(activeCats);
        }
      } catch (err) {
        console.error("Failed to fetch blog categories", err);
      }
    };
    fetchBlogCategories();
  }, []);

  useEffect(() => {
    if (mobileTopMessages.length === 0) return;

    const t = setInterval(() => {
      setCurrentMsg((p) => (p + 1) % mobileTopMessages.length);
    }, 3000);

    return () => clearInterval(t);
  }, [mobileTopMessages]);

  const [results, setResults] = useState<any[]>([]);
  const [flattenedResults, setFlattenedResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const debouncedSearch = useDebounce(searchValue, 500);
  useEffect(() => {
    if (!debouncedSearch || debouncedSearch.length < 3) {
      setResults([]);
      setFlattenedResults([]);
      setShowSearchDropdown(false);
      return;
    }
    const controller = new AbortController();
    const fetchSearchResults = async () => {
      try {
        setSearchLoading(true);
        setShowSearchDropdown(true);
        const res = await fetch(
          `/api/Products?page=1&pageSize=10&searchTerm=${encodeURIComponent(debouncedSearch)}&sortDirection=asc`,
          { signal: controller.signal }
        );
        const json = await res.json();

        const products = json?.data?.items || [];

        setResults(products);

        const flattened = flattenProductsForListing(products);

        setFlattenedResults(flattened);
      } catch (error: any) {
        if (error?.name !== "AbortError") {
          console.error("Search error:", error);
        }
      } finally {
        setSearchLoading(false);
      }
    };

    fetchSearchResults();
    return () => controller.abort();
  }, [debouncedSearch]);

  const searchRef = useRef<HTMLDivElement>(null);
  const mobileSearchRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const insideDesktop = searchRef.current?.contains(e.target as Node);
      const insideMobile = mobileSearchRef.current?.contains(e.target as Node);
      if (!insideDesktop && !insideMobile) {
        setShowSearchDropdown(false);
        setMobileSearchOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, []);


  const [openParents, setOpenParents] = useState<Record<string, boolean>>({});
  const [openChildren, setOpenChildren] = useState<Record<string, boolean>>({});

  // â­ SMOOTH SCROLL
  useEffect(() => {
    let rafId: number;

    const handleScroll = () => {
      const currentScroll = window.scrollY;

      cancelAnimationFrame(rafId);

      rafId = requestAnimationFrame(() => {
        if (currentScroll <= 10) {
          setHideTopBar(false);
        } else if (currentScroll > lastScroll.current && currentScroll > 150) {
          setHideTopBar(true);
        } else if (currentScroll < lastScroll.current - 10) {
          setHideTopBar(false);
        }

        lastScroll.current = currentScroll;
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      cancelAnimationFrame(rafId);
    };
  }, []);



  // Lock body scroll when drawer or mobile search is open
  useEffect(() => {
    document.body.style.overflow = (menuOpen || mobileSearchOpen) ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen, mobileSearchOpen]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();

    if (!searchValue.trim()) return;

    const finalSearch = searchValue;

    setShowSearchDropdown(false);
    setMobileSearchOpen(false);


    router.push(
      `/search?q=${encodeURIComponent(finalSearch)}`
    );
  };


  const openMenu = (category: Category) => {
    setActiveCategory(category);
    setHovered(true);
  };

  const closeMenu = () => {
    setHovered(false);
    setActiveCategory(null);
  };

  const toggleParent = (id: string) =>
    setOpenParents((s) => ({ ...s, [id]: !s[id] }));

  const toggleChild = (id: string) =>
    setOpenChildren((s) => ({ ...s, [id]: !s[id] }));

  return (
    <header
      id="main-header"   // ðŸ‘ˆ ADD THIS
      className="fixed left-0 right-0 z-50"
      style={{
        top: (hideTopBar && !menuOpen) ? '-36px' : '0',
        transition: 'top 300ms ease-in-out',
      }}
    >
      {/* â­ TOP BAR */}
      <div className="bg-[#000000] text-white w-full h-[38px]">
        {/* Mobile Slider */}
        {isClient && mobileTopMessages.length > 0 && (
          <div className="lg:hidden h-full flex items-center px-4">
            <Link
              href={mobileTopMessages[currentMsg]?.link || "#"}
              className="flex items-center justify-center gap-3 w-full"
            >
              <span className="text-white text-xl flex-shrink-0">
                {mobileTopMessages[currentMsg]?.icon}
              </span>

              <div className="flex flex-col text-left leading-tight">
                <span className="font-bold text-[13px] tracking-wide text-white">
                  {mobileTopMessages[currentMsg]?.title}
                </span>

                <span className="text-[11px] text-white opacity-90">
                  {mobileTopMessages[currentMsg]?.subtitle}
                </span>
              </div>
            </Link>
          </div>
        )}

        {/* Desktop - Announcement Bar */}
        <div className="hidden lg:flex h-full items-center justify-center px-6 lg:px-10 xl:px-16">
          {deliveryStrip.length > 0 ? (
            <div className="flex items-center gap-8">
              {deliveryStrip.map((item) => {
                const Icon = iconMap[item.icon] || Truck;
                return (
                  <Link
                    key={item.id}
                    href={`/delivery/${item.slug}`}
                    className="flex items-center gap-2 cursor-pointer hover:bg-white/10 py-1.5 px-3 rounded transition-colors duration-200"
                  >
                    <span className="text-white flex-shrink-0">
                      <Icon size={16} />
                    </span>
                    <span className="text-[13px] font-normal tracking-wide">
                      {item.title}
                      {item.subtitle && (
                        <span className="opacity-75 ml-1 font-normal text-[13px]">
                          — {item.subtitle}
                        </span>
                      )}
                    </span>
                  </Link>
                );
              })}
            </div>
          ) : (
            <Link
              href="/delivery"
              className="flex items-center gap-2 text-[13px] font-normal tracking-wide hover:opacity-80 transition"
            >
              <Truck size={16} />
              <span>Free Standard Delivery On All Products</span>
              <span className="ml-1 opacity-75">→</span>
            </Link>
          )}
        </div>
      </div>

      {/* ⭐ MAIN HEADER */}
      <div className="bg-white shadow-md relative">
        <div className="flex items-center min-h-16 md:min-h-[72px] py-2 md:py-3 px-1 md:px-6 lg:px-20 gap-2 justify-between">

          {/* LEFT: Hamburger + Logo */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
              className="md:hidden text-gray-700 hover:text-[#f38918] p-1"
            >
              <Menu size={22} />
            </button>
            <Link href="/" className="flex items-center">
              <Image
                src="/logo/logo.png?v=3"
                alt="Houszy Logo"
                width={150}
                height={50}
                className="h-10 w-auto sm:h-11 md:h-[52px] md:w-auto object-contain"
                priority
              />
            </Link>
          </div>

          {/* CENTER: DESKTOP CATEGORIES NAV */}
          <div
            ref={megaWrapperRef}
            className="hidden md:flex flex-1 justify-start ml-4 lg:ml-6 relative"
            onMouseLeave={() => {
              setHovered(false);
              setActiveCategory(null);
              setBlogsHovered(false);
            }}
          >
            <nav className="flex flex-wrap items-center text-[12px] lg:text-[13px] xl:text-[14px] font-semibold text-black gap-x-2.5 lg:gap-x-4 xl:gap-x-5 gap-y-1.5 transition-all duration-300">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className="relative flex items-center py-1.5"
                  onMouseEnter={() => {
                    setBlogsHovered(false);
                    if (cat.subCategories?.length) {
                      setActiveCategory(cat);
                      setHovered(true);
                    } else {
                      setHovered(false);
                      setActiveCategory(null);
                    }
                  }}
                >
                  <Link
                    href={`/category/${cat.slug}`}
                    className={`relative flex items-center gap-1 cursor-pointer py-1 transition-colors whitespace-nowrap group ${activeCategory?.id === cat.id ? "text-[#f38918]" : "text-black hover:text-[#f38918]"
                      }`}
                  >
                    {cat.name}
                    {cat.subCategories && cat.subCategories.length > 0 && (
                      <ChevronDown
                        size={14}
                        className={`transition-transform duration-300 ease-in-out ${activeCategory?.id === cat.id && hovered ? "rotate-180" : "rotate-0"
                          }`}
                      />
                    )}
                    <span className={`absolute bottom-0 left-0 h-[2.5px] bg-[#f38918] transition-all duration-200 ${activeCategory?.id === cat.id ? "w-full" : "w-0 group-hover:w-full"
                      }`} />
                  </Link>

                  {/* Single column dropdown menu */}
                  {hovered && activeCategory?.id === cat.id && (
                    <div className="absolute top-[100%] left-0 z-50">
                      <MegaMenu activeMainCategory={cat} />
                    </div>
                  )}
                </div>
              ))}

              {/* ⭐ BLOGS NAVIGATION WITH DROPDOWN */}
              <div
                className="relative flex items-center py-1.5"
                onMouseEnter={() => {
                  setBlogsHovered(true);
                  setHovered(false);
                  setActiveCategory(null);
                }}
                onMouseLeave={() => setBlogsHovered(false)}
              >
                <Link
                  href="/blog"
                  className={`relative flex items-center gap-1 cursor-pointer py-1 transition-colors whitespace-nowrap group ${blogsHovered ? "text-[#f38918]" : "text-black hover:text-[#f38918]"
                    }`}
                >
                  Blogs
                  {blogCategories.length > 0 && (
                    <ChevronDown
                      size={14}
                      className={`transition-transform duration-300 ease-in-out ${blogsHovered ? "rotate-180" : "rotate-0"
                        }`}
                    />
                  )}
                  <span
                    className={`absolute bottom-0 left-0 h-[2.5px] bg-[#f38918] transition-all duration-200 ${blogsHovered ? "w-full" : "w-0 group-hover:w-full"
                      }`}
                  />
                </Link>

                {/* Vertical Dropdown list */}
                {blogsHovered && blogCategories.length > 0 && (
                  <div className="absolute top-[100%] left-0 bg-white border border-gray-100 shadow-xl py-2 min-w-[200px] z-50 rounded-md">
                    {blogCategories.map((blogCat) => {
                      const cleanName = blogCat.name.replace(/&amp;/g, "&");
                      return (
                        <Link
                          key={blogCat.id}
                          href={`/blog/category/${blogCat.slug}`}
                          onClick={() => setBlogsHovered(false)}
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#f38918] transition-colors"
                        >
                          {cleanName}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>

              <div
                className="relative flex items-center py-1.5"
                onMouseEnter={() => {
                  setHovered(false);
                  setActiveCategory(null);
                  setBlogsHovered(false);
                }}
              >
                <Link
                  href="/bundle-deals"
                  className="relative flex items-center gap-1 cursor-pointer py-1 transition-colors whitespace-nowrap group text-black hover:text-[#f38918]"
                >
                  Bundle Deals
                  <span className="absolute bottom-0 left-0 h-[2.5px] bg-[#f38918] transition-all duration-200 w-0 group-hover:w-full" />
                </Link>
              </div>

              <Link
                href="/offers"
                onMouseEnter={() => {
                  setHovered(false);
                  setActiveCategory(null);
                  setBlogsHovered(false);
                }}
                className="group relative flex items-center py-1.5 text-[#f38918] transition-colors hover:opacity-80"
              >
                <span className="tracking-wide">Offer</span>
              </Link>
            </nav>
          </div>

          <div className="flex-1 md:hidden" />

          {/* RIGHT: Mobile Icons (search + wishlist + cart + account) */}
          <div className="flex items-center gap-0.5 md:hidden flex-shrink-0">
            <button
              onClick={() => setMobileSearchOpen((v) => !v)}
              aria-label="Search"
              className={`p-2 rounded-full transition ${mobileSearchOpen ? 'bg-[#f38918] text-white' : 'text-gray-700 hover:text-[#f38918]'}`}
            >
              <Search size={20} />
            </button>
            {/* Wishlist */}
            <Link href="/wishlist" className="relative p-1 text-gray-700 hover:text-red-500 transition">
              <Heart
                size={22}
                className={wishlistCount > 0 ? "fill-red-500 text-[#f38918]" : ""}
              />
              {wishlistCount > 0 && (
                <span className="absolute -top-0.5 -right-1 bg-red-500 text-white text-[9px] rounded-full min-w-[16px] h-4 flex items-center justify-center px-0.5">
                  {wishlistCount}
                </span>
              )}
            </Link>
            <button
              className="relative text-gray-700 hover:text-[#f38918] transition p-1"
              onClick={() => router.push("/cart")}
            >
              <ShoppingBag size={22} />
              {isInitialized && cartCount > 0 && (
                <span className="absolute -top-0.5 -right-1 bg-[#f38918] text-white text-[9px] rounded-full min-w-[16px] h-4 flex items-center justify-center px-0.5">
                  {cartCount}
                </span>
              )}
            </button>
            {isAuthenticated && user ? (
              <button onClick={handleAccountClick} className="flex items-center gap-1 text-gray-700 p-1">
                <div className="w-7 h-7 rounded-full bg-[#f38918] text-white flex items-center justify-center text-[11px] font-bold">
                  {user.firstName?.[0]?.toUpperCase() ?? "U"}
                </div>
              </button>
            ) : (
              <button
                onClick={() => router.push("/account")}
                className="px-2 py-1 text-[10px] font-semibold text-white bg-[#f38918] rounded"
              >
                Login
              </button>
            )}
          </div>

          {/* Desktop Icons */}
          <div className="hidden md:flex items-center gap-5 text-gray-700 h-full leading-none flex-shrink-0">
            {/* Search Toggle */}
            <button
              onClick={() => {
                setMobileSearchOpen(!mobileSearchOpen);
                if (!mobileSearchOpen) {
                  setTimeout(() => {
                    const input = document.getElementById("header-search-input");
                    if (input) input.focus();
                  }, 100);
                }
              }}
              aria-label="Search"
              className="hover:text-[#f38918] transition"
            >
              <Search size={22} strokeWidth={1.5} />
            </button>

            {/* User / Login */}
            {isAuthenticated && user ? (
              <button
                onClick={handleAccountClick}
                className="hover:text-[#f38918] transition"
                aria-label="Account"
              >
                <User size={22} strokeWidth={1.5} />
              </button>
            ) : (
              <button
                onClick={() => router.push("/account")}
                className="hover:text-[#f38918] transition"
                aria-label="Login"
              >
                <User size={22} strokeWidth={1.5} />
              </button>
            )}

            {/* Wishlist */}
            <Link
              href="/wishlist"
              className="relative hover:text-[#f38918] transition flex items-center gap-1"
              aria-label="Wishlist"
            >
              <Heart
                size={22}
                strokeWidth={1.5}
                className={wishlistCount > 0 ? "fill-red-500 text-[#f38918]" : ""}
              />
              {wishlistCount > 0 && (
                <span className="absolute -bottom-1 -right-2 bg-red-500 text-white text-[10px] font-bold rounded-full w-[16px] h-[16px] flex items-center justify-center">
                  {wishlistCount}
                </span>
              )}
            </Link>

            {/* Cart */}
            <button
              className="relative hover:text-[#f38918] transition flex items-center gap-1"
              onClick={() => router.push("/cart")}
              aria-label="Cart"
            >
              <ShoppingBag size={22} strokeWidth={1.5} />
              {isInitialized && cartCount > 0 && (
                <span className="absolute -bottom-1 -right-2 bg-black text-white text-[10px] font-bold rounded-full w-[16px] h-[16px] flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* ✅ SEARCH OVERLAY — covers the header perfectly */}
        {mobileSearchOpen && (
          <div
            ref={mobileSearchRef}
            className="absolute inset-0 bg-white z-[60] flex items-center justify-center px-4 md:px-6 lg:px-20"
          >
            <div className="w-full max-w-[50rem] relative flex items-center gap-3">
              <form onSubmit={handleSearch} className="flex-1 relative flex items-center">
                <input
                  type="text"
                  id="header-search-input"
                  autoFocus
                  autoComplete="off"
                  placeholder="Search"
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  onFocus={() => results.length > 0 && setShowSearchDropdown(true)}
                  className="w-full border border-black pl-4 pr-10 py-2.5 text-[15px] text-black focus:outline-none placeholder:text-gray-400 font-normal rounded-none"
                />
                <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-black">
                  <Search size={18} strokeWidth={1.5} />
                </button>
              </form>
              <button
                type="button"
                onClick={() => {
                  setMobileSearchOpen(false);
                  setSearchValue("");
                  setShowSearchDropdown(false);
                }}
                className="text-gray-500 hover:text-black transition"
              >
                <X size={24} strokeWidth={1.5} />
              </button>

              {showSearchDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 shadow-2xl max-h-[55vh] overflow-y-auto z-[70] rounded-none">
                  {searchLoading && <div className="p-4 text-sm text-gray-500">Searching...</div>}
                  {!searchLoading && results.length === 0 && (
                    <div className="p-4 text-sm text-gray-500">No products found</div>
                  )}
                  {!searchLoading && flattenedResults.map((item) => {

                    const product = item.productData;
                    const defaultVariant = item.variantForCard;
                    const cardSlug = item.cardSlug;



                    const basePrice =
                      typeof defaultVariant?.price === "number" &&
                        defaultVariant.price > 0
                        ? defaultVariant.price
                        : product.price;

                    const finalPrice = getDiscountedPrice(product, basePrice);

                    const discountBadge = getDiscountBadge(product);

                    const oldPriceValue =
                      defaultVariant?.compareAtPrice ?? defaultVariant?.oldPrice ??
                      product.compareAtPrice ?? product.oldPrice;

                    const oldPriceData =
                      (defaultVariant?.displayDiscountType ?? product.displayDiscountType) === "OldPrice"
                        ? getOldPriceDiscount(
                          basePrice,
                          oldPriceValue,
                          false
                        )
                        : null;

                    const productImage =
                      defaultVariant?.imageUrl ||
                      product.images?.find((img: any) => img.isMain)?.imageUrl ||
                      product.images?.[0]?.imageUrl;

                    const stockQty = defaultVariant?.stockQuantity ?? product.stockQuantity ?? 0;
                    const isInStock = stockQty > 0;

                    return (
                      <Link
                        key={`${product.id}-${cardSlug}`}
                        href={`/product/${cardSlug}`}
                        onClick={() => {
                          setShowSearchDropdown(false);
                          setSearchValue("");
                          setMobileSearchOpen(false);
                        }}
                        className="flex items-center gap-3 px-3 py-2.5 border-b last:border-b-0 hover:bg-gray-50"
                      >

                        {/* IMAGE */}
                        <img
                          src={
                            productImage?.startsWith("http")
                              ? productImage
                              : `${process.env.NEXT_PUBLIC_API_URL}${productImage}`
                          }
                          alt={product.name}
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = "/placeholder.png";
                          }}
                          className="w-10 h-10 object-contain flex-shrink-0 rounded"
                        />

                        <div className="flex flex-col flex-1 min-w-0">

                          {/* NAME + RATING */}
                          <div className="flex items-center gap-1 flex-wrap">

                            <span className="text-sm font-medium text-gray-800 line-clamp-1">
                              {defaultVariant
                                ? `${product.name} (${[
                                  defaultVariant.option1Value,
                                  defaultVariant.option2Value,
                                  defaultVariant.option3Value,
                                ]
                                  .filter(Boolean)
                                  .join(", ")})`
                                : product.name}
                            </span>

                            {/* â­ RATING */}
                            {typeof product.averageRating === "number" &&
                              product.averageRating > 0 && (
                                <div className="flex items-center gap-0.5">
                                  {renderStars(product.averageRating)}
                                  <span className="text-[10px] text-gray-500">
                                    ({product.approvedReviewCount ?? product.reviewCount ?? 0})
                                  </span>
                                </div>
                              )}
                          </div>

                          {/* CATEGORY + DISCOUNT */}
                          <div className="flex items-center gap-2 flex-wrap">

                            <span className="text-xs text-gray-500">
                              {
                                product.categories?.find((c: any) => c.isPrimary)?.categoryName ??
                                product.categories?.[0]?.categoryName ??
                                ""
                              }
                            </span>

                            {/* SYSTEM DISCOUNT */}
                            {product.displayDiscountType === "System" &&
                              discountBadge && (
                                <span className="text-[10px] px-1.5 py-0.5 bg-red-100 text-red-600 rounded font-semibold">
                                  {discountBadge.type === "percent"
                                    ? `${discountBadge.value}% OFF`
                                    : `£${discountBadge.value} OFF`}
                                </span>
                              )}

                            {/* OLD PRICE DISCOUNT */}
                            {!discountBadge && oldPriceData && (
                              <span className="text-[10px] px-1.5 py-0.5 bg-red-100 text-red-600 rounded font-semibold">
                                {oldPriceData.discount}% OFF
                              </span>
                            )}
                          </div>

                          {/* PRICE + LOYALTY */}
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">

                            <span className="text-sm font-semibold text-[#f38918]">
                              £
                              {(
                                product.displayDiscountType === "System"
                                  ? finalPrice
                                  : basePrice
                              ).toFixed(2)}
                            </span>

                            {/* SYSTEM CUT PRICE */}
                            {product.displayDiscountType === "System" &&
                              discountBadge && (
                                <span className="text-xs text-gray-400 line-through">
                                  £{basePrice.toFixed(2)}
                                </span>
                              )}

                            {/* OLD PRICE CUT */}
                            {!discountBadge && oldPriceData && (
                              <span className="text-xs text-gray-400 line-through">
                                £{oldPriceData.oldPrice.toFixed(2)}
                              </span>
                            )}

                            {/* LOYALTY */}
                            {product.loyaltyPointsMessage && (
                              <span className="text-[10px] px-2 py-0.5 rounded bg-orange-50 text-orange-600 font-medium">
                                {product.loyaltyPointsMessage}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* STOCK */}
                        <div className="ml-auto flex-shrink-0 self-start">
                          {isInStock ? (
                            <span className="text-[10px] px-2 py-1 rounded bg-orange-100 text-orange-600 font-semibold">
                              In Stock
                            </span>
                          ) : (
                            <span className="text-[10px] px-2 py-1 rounded bg-red-100 text-red-600 font-semibold">
                              Out of Stock
                            </span>
                          )}
                        </div>

                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ✅ MOBILE DRAWER */}
      <div
        className={`fixed inset-0 z-[60] transition-opacity duration-300 ${menuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          }`}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/60"
          onClick={() => setMenuOpen(false)}
        />

        {/* Drawer Panel */}
        <aside
          className={`absolute top-0 left-0 h-full w-[82vw] max-w-[320px] bg-white flex flex-col transform transition-transform duration-300 shadow-2xl ${menuOpen ? "translate-x-0" : "-translate-x-full"
            }`}
          role="dialog"
          aria-modal="true"
        >
          {/* â”€â”€ Header â”€â”€ */}
          <div className="bg-white px-4 py-3 flex items-center justify-between flex-shrink-0 border-b border-gray-200">
            <Link href="/" onClick={() => setMenuOpen(false)}>
              <Image src="/logo/logo.png?v=3" alt="logo" width={80} height={25} className="object-contain w-20 h-auto" />
            </Link>
            <button
              onClick={() => setMenuOpen(false)}
              className="text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-full p-1.5 transition"
            >
              <X size={20} />
            </button>
          </div>

          {/* â”€â”€ User Section â”€â”€ */}
          <div className="bg-orange-50 px-4 py-3 flex items-center gap-3 border-b border-orange-100 flex-shrink-0">
            {isAuthenticated && user ? (
              <>
                <div className="w-10 h-10 rounded-full bg-[#f38918] text-white flex items-center justify-center text-base font-bold flex-shrink-0">
                  {user.firstName?.[0]?.toUpperCase() ?? "U"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">Hello, {user.firstName}!</p>
                  <button
                    onClick={() => { handleAccountClick(); setMenuOpen(false); }}
                    className="text-xs text-[#f38918] font-medium hover:underline"
                  >
                    View Account
                  </button>
                </div>
                <button
                  onClick={() => setShowLogoutModal(true)}
                  className="px-3 py-1.5 text-xs font-semibold text-red-600 border border-red-300 rounded-full hover:bg-red-50 transition flex-shrink-0"
                >
                  Logout
                </button>
              </>
            ) : (
              <div className="flex gap-2 w-full">
                <button
                  onClick={() => { router.push("/account?tab=login"); setMenuOpen(false); }}
                  className="flex-1 py-2 text-sm font-semibold text-white bg-[#f38918] rounded-full"
                >
                  Login
                </button>
                <button
                  onClick={() => { router.push("/account?tab=register"); setMenuOpen(false); }}
                  className="flex-1 py-2 text-sm font-semibold text-[#f38918] border border-[#f38918] rounded-full"
                >
                  Register
                </button>
              </div>
            )}
          </div>

          {/* â”€â”€ Scrollable Content â”€â”€ */}
          <div className="flex-1 overflow-y-auto">

            {/* Category label */}
            <div className="px-4 pt-4 pb-1">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Shop by Category</p>
            </div>

            {/* Category List */}
            <nav>
              {mobileCategories.map((parent) => (
                <div key={parent.id} className="border-b border-gray-100">
                  {parent.subCategories && parent.subCategories.length > 0 ? (
                    <>
                      <div className="w-full flex items-center justify-between px-4 py-3 hover:bg-orange-50 transition">

                        {/* CATEGORY LINK */}
                        <Link
                          href={`/category/${parent.slug}`}
                          onClick={() => setMenuOpen(false)}
                          className="font-medium text-gray-800 text-sm flex-1"
                        >
                          {parent.name}
                        </Link>

                        {/* EXPAND BUTTON */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleParent(parent.id);
                          }}
                          className="p-1"
                        >
                          <ChevronDown
                            size={16}
                            className={`text-[#f38918] transition-transform duration-300 ${openParents[parent.id] ? "rotate-180" : "rotate-0"
                              }`}
                          />
                        </button>

                      </div>

                      <div
                        className={`overflow-hidden transition-all duration-300 ease-in-out ${openParents[parent.id] ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"
                          }`}
                      >
                        <div className="bg-orange-50/60 pl-6 pr-4 pb-2">
                          {parent.subCategories.map((sub) => (
                            <div key={sub.id}>
                              {sub.subCategories && sub.subCategories.length > 0 ? (
                                <>
                                  <div className="w-full flex items-center justify-between py-2 text-sm text-gray-700 hover:text-[#f38918] transition">

                                    {/* SUBCATEGORY LINK */}
                                    <Link
                                      href={`/category/${sub.slug}`}
                                      onClick={() => setMenuOpen(false)}
                                      className="flex-1"
                                    >
                                      {sub.name}
                                    </Link>

                                    {/* EXPAND BUTTON */}
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleChild(sub.id);
                                      }}
                                      className="p-1"
                                    >
                                      <ChevronRight
                                        size={14}
                                        className={`transition-transform duration-300 ${openChildren[sub.id] ? "rotate-90" : "rotate-0"
                                          }`}
                                      />
                                    </button>

                                  </div>
                                  <div
                                    className={`overflow-hidden transition-all duration-300 ${openChildren[sub.id] ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
                                      }`}
                                  >
                                    <div className="pl-3 border-l-2 border-orange-200 ml-1 mb-1">
                                      {sub.subCategories.map((c) => (
                                        <Link
                                          key={c.id}
                                          href={`/category/${c.slug ?? "#"}`}
                                          onClick={() => setMenuOpen(false)}
                                          className="block py-1.5 text-xs text-gray-600 hover:text-[#f38918] transition"
                                        >
                                          {c.name}
                                        </Link>
                                      ))}
                                    </div>
                                  </div>
                                </>
                              ) : (
                                <Link
                                  href={`/category/${sub.slug ?? "#"}`}
                                  onClick={() => setMenuOpen(false)}
                                  className="block py-2 text-sm text-gray-700 hover:text-[#f38918] transition"
                                >
                                  {sub.name}
                                </Link>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  ) : (
                    <Link
                      href={`/category/${parent.slug ?? "#"}`}
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center justify-between px-4 py-3 text-sm font-medium text-gray-700 hover:text-[#f38918] hover:bg-orange-50 transition"
                    >
                      {parent.name}
                      <ChevronRight size={15} className="text-gray-400" />
                    </Link>
                  )}
                </div>
              ))}
            </nav>

            {/* Quick Links */}
            <div className="px-4 pt-4 pb-1">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Quick Links</p>
            </div>
            <div className="pb-2">
              <Link
                href="/offers"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 transition border-b border-gray-100"
              >
                <BadgePercent size={18} />
                Offers &amp; Deals
              </Link>
              <Link
                href="/brands"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-orange-50 hover:text-[#f38918] transition border-b border-gray-100"
              >
                <Star size={18} />
                Shop by Brand
              </Link>

              {/* Mobile Blog Categories Dropdown */}
              <div className="border-b border-gray-100">
                <div className="w-full flex items-center justify-between px-4 py-3 hover:bg-orange-50 transition">
                  <Link
                    href="/blog"
                    onClick={() => setMenuOpen(false)}
                    className="font-medium text-gray-800 text-sm flex-1"
                  >
                    Blogs
                  </Link>
                  {blogCategories.length > 0 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setMobileBlogsOpen(!mobileBlogsOpen);
                      }}
                      className="p-1"
                    >
                      <ChevronDown
                        size={16}
                        className={`text-[#f38918] transition-transform duration-300 ${mobileBlogsOpen ? "rotate-180" : "rotate-0"
                          }`}
                      />
                    </button>
                  )}
                </div>

                {mobileBlogsOpen && blogCategories.length > 0 && (
                  <div className="bg-orange-50/60 pl-6 pr-4 pb-2">
                    {blogCategories.map((blogCat) => {
                      const cleanName = blogCat.name.replace(/&amp;/g, "&");
                      return (
                        <Link
                          key={blogCat.id}
                          href={`/blog/category/${blogCat.slug}`}
                          onClick={() => setMenuOpen(false)}
                          className="block py-2 text-sm text-gray-700 hover:text-[#f38918] transition"
                        >
                          {cleanName}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
              <Link
                href="/bundle-deals"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-orange-50 hover:text-[#f38918] transition border-b border-gray-100 font-medium"
              >
                Bundle Deals
              </Link>
              <Link
                href="/cart"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-orange-50 hover:text-[#f38918] transition border-b border-gray-100"
              >
                <ShoppingBag size={18} />
                My Cart
                {isInitialized && cartCount > 0 && (
                  <span className="ml-auto bg-[#f38918] text-white text-xs rounded-full px-2 py-0.5">{cartCount}</span>
                )}
              </Link>
              <Link
                href="/wishlist"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-orange-50 hover:text-[#f38918] transition border-b border-gray-100"
              >
                <Heart size={18} />
                My Wishlist
                {wishlistCount > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-2 py-0.5">{wishlistCount}</span>
                )}
              </Link>

            </div>
          </div>

          {/* â”€â”€ Drawer Footer â”€â”€ */}
          <div className="border-t bg-gray-50 px-4 py-3 flex-shrink-0">
            <div className="flex gap-3">

              <a
                href="https://www.facebook.com/houszy/"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Image src="/social/facebook.svg" alt="fb" width={26} height={26} />
              </a>

              <a
                href="https://www.instagram.com/houszy/"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Image src="/social/instagram.svg" alt="ig" width={26} height={26} />
              </a>

              <a
                href="https://x.com/houszy"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Image src="/social/x.svg" alt="x" width={26} height={26} />
              </a>

              <a
                href="https://www.youtube.com/@houszy"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Image src="/social/youtube.svg" alt="yt" width={26} height={26} />
              </a>

              <a
                href="https://uk.pinterest.com/houszy/"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Image src="/social/pinterest.svg" alt="pinterest" width={26} height={26} />
              </a>

              <a
                href="https://www.tiktok.com/@houszy/"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Image src="/social/tiktok.svg" alt="tiktok" width={26} height={26} />
              </a>

            </div>
          </div>
        </aside>
      </div>
      {showLogoutModal && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">

          {/* BACKDROP */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowLogoutModal(false)}
          />

          {/* MODAL */}
          <div className="relative w-full sm:max-w-sm bg-white rounded-t-2xl sm:rounded-xl p-5 animate-slideUp">

            <h3 className="text-lg font-semibold text-gray-800">
              Logout?
            </h3>

            <p className="text-sm text-gray-500 mt-1">
              Are you sure you want to logout from your account?
            </p>

            <div className="flex gap-3 mt-5">

              {/* CANCEL */}
              <button
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 py-2 rounded-lg border border-gray-300 text-gray-700 font-medium"
              >
                Cancel
              </button>

              {/* CONFIRM */}
              <button
                onClick={() => {
                  logout();
                  setShowLogoutModal(false);
                  setMenuOpen(false);
                }}
                className="flex-1 py-2 rounded-lg bg-red-600 text-white font-semibold"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}



