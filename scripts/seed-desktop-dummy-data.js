/**
 * PQN Party Queen - Comprehensive Desktop & Demo Dummy Data Seeder
 * Seeds Admins, Customers, Categories, Luxury Products, Variants, Orders, Reviews
 */
require("dotenv").config();
const bcrypt = require("bcryptjs");
const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaClient } = require("@prisma/client");

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("ERROR: DATABASE_URL is not set in .env!");
  process.exit(1);
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function seed() {
  console.log("================================================================================");
  console.log("👑 PQN PARTY QUEEN — SEEDING LUXURY DESKTOP DUMMY DATA & CREDENTIALS");
  console.log("================================================================================\n");

  // 1. ADMIN ACCOUNTS
  console.log("▶ 1. Seeding Admin Accounts...");
  const adminPasswordHash = await bcrypt.hash("Admin@12345", 10);
  const managerPasswordHash = await bcrypt.hash("Manager@12345", 10);

  const superAdmin = await prisma.admin.upsert({
    where: { email: "admin@pqnpartyqueen.com" },
    update: { name: "Super Admin", passwordHash: adminPasswordHash },
    create: { email: "admin@pqnpartyqueen.com", name: "Super Admin", passwordHash: adminPasswordHash },
  });
  console.log(`   ✓ Admin seeded: ${superAdmin.email} (Password: Admin@12345)`);

  const masterAdmin = await prisma.admin.upsert({
    where: { email: "thep4rtyqueen@gmail.com" },
    update: { name: "PQN Master Administrator", passwordHash: adminPasswordHash },
    create: { email: "thep4rtyqueen@gmail.com", name: "PQN Master Administrator", passwordHash: adminPasswordHash },
  });
  console.log(`   ✓ Admin seeded: ${masterAdmin.email} (Password: Admin@12345)`);

  const manager = await prisma.admin.upsert({
    where: { email: "manager@pqnpartyqueen.com" },
    update: { name: "Store Manager Pooja", passwordHash: managerPasswordHash },
    create: { email: "manager@pqnpartyqueen.com", name: "Store Manager Pooja", passwordHash: managerPasswordHash },
  });
  console.log(`   ✓ Manager seeded: ${manager.email} (Password: Manager@12345)`);

  // 2. DEMO CUSTOMER ACCOUNTS
  console.log("\n▶ 2. Seeding Customer Accounts...");
  const customerPasswordHash = await bcrypt.hash("Customer@12345", 10);

  const customer1 = await prisma.customer.upsert({
    where: { email: "customer@pqnpartyqueen.com" },
    update: {
      name: "Priya Sharma",
      phone: "+91 98765 12345",
      passwordHash: customerPasswordHash,
      bustSize: "36",
      waistSize: "30",
      hipSize: "40",
      height: "5'6\"",
    },
    create: {
      email: "customer@pqnpartyqueen.com",
      name: "Priya Sharma",
      phone: "+91 98765 12345",
      passwordHash: customerPasswordHash,
      bustSize: "36",
      waistSize: "30",
      hipSize: "40",
      height: "5'6\"",
    },
  });
  console.log(`   ✓ Customer seeded: ${customer1.email} (Password: Customer@12345)`);

  // Address for Customer
  const address1 = await prisma.address.findFirst({ where: { customerId: customer1.id } });
  if (!address1) {
    await prisma.address.create({
      data: {
        customerId: customer1.id,
        tag: "Home",
        name: "Priya Sharma",
        phone: "+91 98765 12345",
        street: "B-42, Vasant Vihar, Sector 8",
        city: "New Delhi",
        state: "Delhi",
        pincode: "110057",
        country: "India",
        isDefault: true,
      },
    });
  }

  // 3. CATEGORIES
  console.log("\n▶ 3. Seeding Categories...");
  const categoriesData = [
    {
      slug: "lehengas",
      name: "Bridal & Festive Lehengas",
      description: "Handcrafted bridal, festive, and cocktail lehengas with intricate zari, gota patti, and resham threadwork.",
      image: "/products/lehenga-1.JPG",
    },
    {
      slug: "suit-sets",
      name: "Luxury Suit Sets",
      description: "Regal kalidar anarkalis, embroidered shararas, and straight-cut celebratory palazzo suits.",
      image: "/products/suit-1.JPG",
    },
    {
      slug: "sarees",
      name: "Heritage & Cocktail Sarees",
      description: "Pre-draped cocktail drapes, tissue organza, pure georgette, and heritage Banarasi silk sarees.",
      image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800",
    },
    {
      slug: "gowns",
      name: "Gowns & Indo-Western",
      description: "Haute couture evening reception gowns, trail drapes, and modern structured Indo-western silhouettes.",
      image: "https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=800",
    },
    {
      slug: "cord-sets",
      name: "Designer Cord Sets",
      description: "Contemporary festive cord sets, embroidered jackets, and stylish party silhouettes for modern celebrations.",
      image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800",
    },
    {
      slug: "dupattas",
      name: "Velvet & Silk Dupattas",
      description: "Artisanal Banarasi silk odhanis, heavy embroidered velvet shawls, and embellished bridal trousseau dupattas.",
      image: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=800",
    },
  ];

  const categoryMap = {};
  for (const cat of categoriesData) {
    const c = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: cat,
      create: cat,
    });
    categoryMap[c.slug] = c.id;
    console.log(`   ✓ Category: ${c.name}`);
  }

  // 4. LUXURY PRODUCTS & VARIANTS
  console.log("\n▶ 4. Seeding Luxury Indian Couture Catalog & Variants...");
  const productsData = [
    {
      name: "Noor-e-Zari Handcrafted Bridal Lehenga",
      slug: "noor-e-zari-handcrafted-bridal-lehenga",
      sku: "PQN-LH-001",
      price: 89999,
      salePrice: 74999,
      categorySlug: "lehengas",
      description: "Grand crimson red pure silk lehenga adorned with antique gold zardozi, hand-beaded crystals, dabka embroidery, and dual net dupattas for the regal Indian bride.",
      videoUrl: "/videos/runway-sample.mp4",
      weight: 3.5,
      length: 45,
      width: 35,
      height: 15,
      images: [
        { url: "/products/lehenga-1.JPG", altText: "Noor-e-Zari Lehenga Front", color: "Crimson Red" },
        { url: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=800", altText: "Detail Embroidery", color: "Crimson Red" },
      ],
      variants: [
        { size: "S", color: "Crimson Red", stock: 4 },
        { size: "M", color: "Crimson Red", stock: 6 },
        { size: "L", color: "Crimson Red", stock: 3 },
        { size: "XL", color: "Crimson Red", stock: 2 },
      ],
    },
    {
      name: "Gulbahar Velvet Banarasi Silk Lehenga",
      slug: "gulbahar-velvet-banarasi-silk-lehenga",
      sku: "PQN-LH-002",
      price: 64999,
      salePrice: 54999,
      categorySlug: "lehengas",
      description: "Deep plum micro-velvet kalidar lehenga matched with handcrafted Banarasi brocade blouse and scallop scalloped border organza veil.",
      videoUrl: "/videos/runway-sample.mp4",
      weight: 2.8,
      length: 40,
      width: 30,
      height: 12,
      images: [
        { url: "/products/lehenga-1.JPG", altText: "Gulbahar Velvet Lehenga", color: "Plum Velvet" },
        { url: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800", altText: "Brocade Details", color: "Plum Velvet" },
      ],
      variants: [
        { size: "S", color: "Plum", stock: 5 },
        { size: "M", color: "Plum", stock: 8 },
        { size: "L", color: "Plum", stock: 4 },
      ],
    },
    {
      name: "Chandrika Tissue Organza Cocktail Saree",
      slug: "chandrika-tissue-organza-cocktail-saree",
      sku: "PQN-SR-001",
      price: 34999,
      salePrice: 28999,
      categorySlug: "sarees",
      description: "Shimmering molten gold tissue organza saree hand-finished with delicate cutwork borders and accompanied by an unstitched designer metallic bustier blouse.",
      weight: 0.9,
      length: 30,
      width: 25,
      height: 6,
      images: [
        { url: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800", altText: "Chandrika Tissue Saree", color: "Molten Gold" },
      ],
      variants: [
        { size: "Free Size", color: "Molten Gold", stock: 12 },
        { size: "Free Size", color: "Rose Champagne", stock: 9 },
      ],
    },
    {
      name: "Virasat Heirloom Kanjeevaram Silk Saree",
      slug: "virasat-heirloom-kanjeevaram-silk-saree",
      sku: "PQN-SR-002",
      price: 49999,
      salePrice: 42999,
      categorySlug: "sarees",
      description: "Authentic Kanchipuram silk woven with pure silver zari dipped in 24k gold leaf, depicting temple motifs, mayil chakram, and majestic pallu borders.",
      weight: 1.2,
      length: 32,
      width: 26,
      height: 7,
      images: [
        { url: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800", altText: "Kanjeevaram Silk Saree", color: "Royal Emerald" },
      ],
      variants: [
        { size: "Free Size", color: "Royal Emerald", stock: 7 },
        { size: "Free Size", color: "Vermilion Red", stock: 5 },
      ],
    },
    {
      name: "Shahi Pishwas Heavy Embroidered Anarkali Set",
      slug: "shahi-pishwas-heavy-embroidered-anarkali-set",
      sku: "PQN-ST-001",
      price: 38999,
      salePrice: 31999,
      categorySlug: "suit-sets",
      description: "Opulent emerald green raw silk 3-piece anarkali suit set with heavy tilla embroidery on neckline and sleeves, paired with churidar pants and crushed tissue dupatta.",
      weight: 1.8,
      length: 35,
      width: 28,
      height: 8,
      images: [
        { url: "/products/suit-1.JPG", altText: "Shahi Pishwas Anarkali", color: "Emerald Green" },
      ],
      variants: [
        { size: "S", color: "Emerald Green", stock: 4 },
        { size: "M", color: "Emerald Green", stock: 6 },
        { size: "L", color: "Emerald Green", stock: 5 },
        { size: "XL", color: "Emerald Green", stock: 2 },
      ],
    },
    {
      name: "Kashmiri Aari Tilla Embroidered Sharara Suit",
      slug: "kashmiri-aari-tilla-embroidered-sharara-suit",
      sku: "PQN-ST-002",
      price: 29999,
      salePrice: 24999,
      categorySlug: "suit-sets",
      description: "Powder peach georgette short kurti complemented by a voluminous tiered sharara pants and scalloped pearl dupatta, hand-embroidered by master Kashmiri artisans.",
      weight: 1.5,
      length: 35,
      width: 28,
      height: 8,
      images: [
        { url: "/products/suit-1.JPG", altText: "Kashmiri Sharara Suit", color: "Powder Peach" },
      ],
      variants: [
        { size: "S", color: "Powder Peach", stock: 5 },
        { size: "M", color: "Powder Peach", stock: 7 },
        { size: "L", color: "Powder Peach", stock: 4 },
      ],
    },
    {
      name: "Midnight Azure Indo-Western Reception Gown",
      slug: "midnight-azure-indo-western-reception-gown",
      sku: "PQN-GW-001",
      price: 52999,
      salePrice: 44999,
      categorySlug: "gowns",
      description: "Dramatic midnight blue structured evening gown with corset bodice, hand-embellished Swarovski stones, asymmetrical shoulder cape, and sweeping floor trail.",
      weight: 2.4,
      length: 42,
      width: 32,
      height: 10,
      images: [
        { url: "https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=800", altText: "Midnight Azure Gown", color: "Midnight Azure" },
      ],
      variants: [
        { size: "XS", color: "Midnight Azure", stock: 2 },
        { size: "S", color: "Midnight Azure", stock: 4 },
        { size: "M", color: "Midnight Azure", stock: 5 },
        { size: "L", color: "Midnight Azure", stock: 3 },
      ],
    },
    {
      name: "Aethelgard Rose Gold Jacquard Cord Set",
      slug: "aethelgard-rose-gold-jacquard-cord-set",
      sku: "PQN-CS-001",
      price: 21999,
      salePrice: 17999,
      categorySlug: "cord-sets",
      description: "Ultra-luxurious 2-piece tailored coordinate set made from pure woven metallic jacquard, featuring notched lapels, pearl buttons, and fluid cigarette trousers.",
      weight: 1.1,
      length: 30,
      width: 25,
      height: 6,
      images: [
        { url: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800", altText: "Rose Gold Jacquard Cord Set", color: "Rose Gold" },
      ],
      variants: [
        { size: "S", color: "Rose Gold", stock: 6 },
        { size: "M", color: "Rose Gold", stock: 8 },
        { size: "L", color: "Rose Gold", stock: 5 },
      ],
    },
    {
      name: "Imperial Emerald Silk Velvet Shawl Dupatta",
      slug: "imperial-emerald-silk-velvet-shawl-dupatta",
      sku: "PQN-DP-001",
      price: 18999,
      salePrice: 15999,
      categorySlug: "dupattas",
      description: "Sumptuous deep forest emerald micro-velvet bridal shawl lined with pure mulberry silk, framed by four-sided marodi and dabka borders.",
      weight: 1.0,
      length: 30,
      width: 25,
      height: 5,
      images: [
        { url: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=800", altText: "Imperial Velvet Dupatta", color: "Forest Emerald" },
      ],
      variants: [
        { size: "Free Size", color: "Forest Emerald", stock: 15 },
        { size: "Free Size", color: "Royal Ruby", stock: 10 },
      ],
    },
  ];

  for (const item of productsData) {
    const categoryId = categoryMap[item.categorySlug];
    const product = await prisma.product.upsert({
      where: { slug: item.slug },
      update: {
        name: item.name,
        sku: item.sku,
        price: item.price,
        salePrice: item.salePrice,
        description: item.description,
        videoUrl: item.videoUrl || null,
        status: "ACTIVE",
        weight: item.weight,
        length: item.length,
        width: item.width,
        height: item.height,
        categoryId,
      },
      create: {
        name: item.name,
        slug: item.slug,
        sku: item.sku,
        price: item.price,
        salePrice: item.salePrice,
        description: item.description,
        videoUrl: item.videoUrl || null,
        status: "ACTIVE",
        weight: item.weight,
        length: item.length,
        width: item.width,
        height: item.height,
        categoryId,
      },
    });

    // Images
    for (let i = 0; i < item.images.length; i++) {
      const img = item.images[i];
      const existingImg = await prisma.productImage.findFirst({
        where: { productId: product.id, url: img.url },
      });
      if (!existingImg) {
        await prisma.productImage.create({
          data: {
            productId: product.id,
            url: img.url,
            altText: img.altText,
            sortOrder: i,
            color: img.color,
          },
        });
      }
    }

    // Variants
    for (const v of item.variants) {
      await prisma.productVariant.upsert({
        where: {
          productId_size_color: {
            productId: product.id,
            size: v.size,
            color: v.color || "Standard",
          },
        },
        update: { stock: v.stock },
        create: {
          productId: product.id,
          size: v.size,
          color: v.color || "Standard",
          stock: v.stock,
        },
      });
    }

    console.log(`   ✓ Product: ${product.name} (SKU: ${product.sku}) - Price: ₹${product.price}`);
  }

  // 5. SAMPLE ORDERS & REVIEWS
  console.log("\n▶ 5. Seeding Sample Orders & Customer Reviews...");
  const sampleProduct = await prisma.product.findFirst({ where: { slug: "noor-e-zari-handcrafted-bridal-lehenga" } });
  
  if (sampleProduct) {
    const orderNum = "PQN-DEMO-2026-001";
    const existingOrder = await prisma.order.findUnique({ where: { orderNumber: orderNum } });
    if (!existingOrder) {
      await prisma.order.create({
        data: {
          orderNumber: orderNum,
          customerId: customer1.id,
          status: "DELIVERED",
          totalAmount: 74999,
          shippingName: "Priya Sharma",
          shippingPhone: "+91 98765 12345",
          shippingAddress: "B-42, Vasant Vihar, Sector 8",
          shippingCity: "New Delhi",
          shippingState: "Delhi",
          shippingPincode: "110057",
          paymentMethod: "PREPAID",
          paymentStatus: "PAID",
          awbNumber: "BLUEDART-882910392",
          courierName: "Blue Dart Express",
          deliveredAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          items: {
            create: [
              {
                productId: sampleProduct.id,
                productName: sampleProduct.name,
                size: "M",
                color: "Crimson Red",
                quantity: 1,
                price: 74999,
              },
            ],
          },
        },
      });
      console.log(`   ✓ Sample Order Created: ${orderNum}`);
    }

    // Sample Review
    const existingReview = await prisma.review.findFirst({ where: { productId: sampleProduct.id, authorEmail: customer1.email } });
    if (!existingReview) {
      await prisma.review.create({
        data: {
          productId: sampleProduct.id,
          rating: 5,
          title: "Breathtaking Craftsmanship for my Wedding!",
          comment: "The hand embroidery and weight of the zari work exceeded all my expectations. PQN's bespoke sizing concierge ensured a flawless fit. Truly royal couture!",
          authorName: "Priya S.",
          authorEmail: customer1.email,
          isVerified: true,
          status: "APPROVED",
          helpfulVotes: 14,
        },
      });
      console.log(`   ✓ Verified Review Created for ${sampleProduct.name}`);
    }
  }

  console.log("\n================================================================================");
  console.log("✅ SEEDING COMPLETE! ALL DUMMY DATA & CREDENTIALS READY.");
  console.log("================================================================================\n");
}

seed()
  .catch((err) => {
    console.error("SEEDING FAILED:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
