import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ProductStatus } from "@/app/generated/prisma/client";
import {
  getAdminSessionCookieName,
  verifyAdminSession,
} from "@/lib/admin-auth";

function getAdminTokenFromRequest(
  request: Request
): string | undefined {
  const cookieHeader =
    request.headers.get("cookie") || "";

  return cookieHeader
    .split(";")
    .map((cookie) => cookie.trim())
    .find((cookie) =>
      cookie.startsWith(
        `${getAdminSessionCookieName()}=`
      )
    )
    ?.split("=")
    .slice(1)
    .join("=");
}

async function requireAdmin(
  request: Request
): Promise<boolean> {
  const token =
    getAdminTokenFromRequest(request);

  return verifyAdminSession(token);
}

/* =========================================================
   GET PRODUCTS
   PUBLIC
   ========================================================= */

export async function GET() {
  try {
    const products =
      await prisma.product.findMany({
        where: {
          status: ProductStatus.ACTIVE,
        },

        include: {
          category: true,

          images: {
            orderBy: {
              sortOrder: "asc",
            },
          },

          variants: {
            orderBy: {
              createdAt: "asc",
            },
          },
        },

        orderBy: {
          createdAt: "desc",
        },
      });

    return NextResponse.json(products);
  } catch (error) {
    console.error(
      "PUBLIC PRODUCTS GET ERROR:",
      error
    );

    return NextResponse.json(
      {
        error: "Failed to fetch products.",
      },
      { status: 500 }
    );
  }
}

/* =========================================================
   CREATE PRODUCT
   ADMIN ONLY
   ========================================================= */

export async function POST(
  request: Request
) {
  const valid =
    await requireAdmin(request);

  if (!valid) {
    return NextResponse.json(
      {
        error: "Unauthorized.",
      },
      { status: 401 }
    );
  }

  try {
    const body =
      await request.json();

    const name =
      typeof body.name === "string"
        ? body.name.trim()
        : "";

    const slug =
      typeof body.slug === "string"
        ? body.slug.trim()
        : "";

    const description =
      typeof body.description === "string"
        ? body.description.trim()
        : "";

    const videoUrl =
      typeof body.videoUrl === "string"
        ? body.videoUrl.trim()
        : null;

    const sku =
      typeof body.sku === "string"
        ? body.sku.trim()
        : "";

    const categoryId =
      typeof body.categoryId === "string"
        ? body.categoryId.trim()
        : "";

    const price =
      Number(body.price);

    const salePrice =
      body.salePrice === "" ||
      body.salePrice === null ||
      body.salePrice === undefined
        ? null
        : Number(body.salePrice);

    const status =
      typeof body.status === "string"
        ? body.status
        : "DRAFT";

    const images =
      Array.isArray(body.images)
        ? body.images
        : [];

    const variants =
      Array.isArray(body.variants)
        ? body.variants
        : [];

    /* ---------------------------------------------
       REQUIRED FIELDS
       --------------------------------------------- */

    if (
      !name ||
      !slug ||
      !sku ||
      !categoryId
    ) {
      return NextResponse.json(
        {
          error:
            "Name, slug, SKU and category are required.",
        },
        { status: 400 }
      );
    }

    if (
      !Number.isFinite(price) ||
      price < 0
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid product price.",
        },
        { status: 400 }
      );
    }

    if (
      salePrice !== null &&
      (!Number.isFinite(
        salePrice
      ) ||
        salePrice < 0)
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid sale price.",
        },
        { status: 400 }
      );
    }

    if (
      salePrice !== null &&
      salePrice > price
    ) {
      return NextResponse.json(
        {
          error:
            "Sale price cannot be higher than the regular price.",
        },
        { status: 400 }
      );
    }

    /* ---------------------------------------------
       STATUS
       --------------------------------------------- */

    if (
      !Object.values(
        ProductStatus
      ).includes(
        status as ProductStatus
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid product status.",
        },
        { status: 400 }
      );
    }

    /* ---------------------------------------------
       CATEGORY
       --------------------------------------------- */

    const category =
      await prisma.category.findUnique({
        where: {
          id: categoryId,
        },
      });

    if (!category) {
      return NextResponse.json(
        {
          error:
            "Category not found.",
        },
        { status: 400 }
      );
    }

    /* ---------------------------------------------
       UNIQUE SLUG / SKU
       --------------------------------------------- */

    const existingProduct =
      await prisma.product.findFirst({
        where: {
          OR: [
            {
              slug,
            },
            {
              sku,
            },
          ],
        },

        select: {
          id: true,
          slug: true,
          sku: true,
        },
      });

    if (existingProduct) {
      if (
        existingProduct.slug ===
        slug
      ) {
        return NextResponse.json(
          {
            error:
              "A product with this slug already exists.",
          },
          { status: 409 }
        );
      }

      if (
        existingProduct.sku === sku
      ) {
        return NextResponse.json(
          {
            error:
              "A product with this SKU already exists.",
          },
          { status: 409 }
        );
      }
    }

    /* ---------------------------------------------
       CLEAN IMAGES
       --------------------------------------------- */

    const cleanedImages =
      images
        .map(
          (
            image: {
              url?: unknown;
              altText?: unknown;
              sortOrder?: unknown;
            },
            index: number
          ) => ({
            url:
              typeof image.url ===
              "string"
                ? image.url.trim()
                : "",

            altText:
              typeof image.altText ===
              "string"
                ? image.altText.trim()
                : null,

            sortOrder:
              Number.isInteger(
                Number(
                  image.sortOrder
                )
              )
                ? Number(
                    image.sortOrder
                  )
                : index,
          })
        )
        .filter(
          (image: {
            url: string;
          }) =>
            image.url.length > 0
        );

    /* ---------------------------------------------
       CLEAN VARIANTS
       --------------------------------------------- */

    const cleanedVariants =
      variants
        .map(
          (
            variant: {
              size?: unknown;
              color?: unknown;
              stock?: unknown;
            }
          ) => ({
            size:
              typeof variant.size ===
              "string"
                ? variant.size.trim()
                : "",

            color:
              typeof variant.color ===
              "string"
                ? variant.color.trim()
                : null,

            stock:
              Number.isInteger(
                Number(
                  variant.stock
                )
              ) &&
              Number(
                variant.stock
              ) >= 0
                ? Number(
                    variant.stock
                  )
                : 0,
          })
        )
        .filter(
          (variant: {
            size: string;
          }) =>
            variant.size.length > 0
        );

    /* ---------------------------------------------
       CREATE PRODUCT
       --------------------------------------------- */

    const product =
      await prisma.product.create({
        data: {
          name,
          slug,
          description:
            description || null,
          videoUrl:
            videoUrl || null,
          sku,
          price,
          salePrice,
          status:
            status as ProductStatus,
          categoryId,

          images: {
            create:
              cleanedImages,
          },

          variants: {
            create:
              cleanedVariants,
          },
        },

        include: {
          category: true,

          images: {
            orderBy: {
              sortOrder: "asc",
            },
          },

          variants: true,
        },
      });

    return NextResponse.json(
      {
        success: true,
        product,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "ADMIN PRODUCTS POST ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to create product.",
      },
      { status: 500 }
    );
  }
}