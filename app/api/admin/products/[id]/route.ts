import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ProductStatus } from "@/app/generated/prisma/client";
import {
  getAdminSessionCookieName,
  verifyAdminSession,
} from "@/lib/admin-auth";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

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
   GET SINGLE PRODUCT
   ========================================================= */

export async function GET(
  request: Request,
  context: RouteContext
) {
  const valid = await requireAdmin(request);

  if (!valid) {
    return NextResponse.json(
      {
        error: "Unauthorized.",
      },
      { status: 401 }
    );
  }

  try {
    const { id } = await context.params;

    const product =
      await prisma.product.findUnique({
        where: {
          id,
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

    if (!product) {
      return NextResponse.json(
        {
          error: "Product not found.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      product,
    });
  } catch (error) {
    console.error(
      "ADMIN PRODUCT GET ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to load product.",
      },
      { status: 500 }
    );
  }
}

/* =========================================================
   UPDATE PRODUCT
   ========================================================= */

export async function PATCH(
  request: Request,
  context: RouteContext
) {
  const valid = await requireAdmin(request);

  if (!valid) {
    return NextResponse.json(
      {
        error: "Unauthorized.",
      },
      { status: 401 }
    );
  }

  try {
    const { id } = await context.params;
    const body = await request.json();

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

    const price = Number(body.price);

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

    const images = Array.isArray(body.images)
      ? body.images
      : [];

    const variants = Array.isArray(
      body.variants
    )
      ? body.variants
      : [];

    // Physical Package Dimensions & Weight for Shipping (in kg and cm)
    const rawWeight = body.weight !== undefined && body.weight !== null && body.weight !== ""
      ? Number(body.weight)
      : (body.weightKg !== undefined && body.weightKg !== "" ? Number(body.weightKg) : (body.weightGrams ? Number(body.weightGrams) / 1000 : 0.8));
    const weight = Number.isFinite(rawWeight) ? rawWeight : 0.8;

    const rawLength = body.length !== undefined && body.length !== null && body.length !== ""
      ? Number(body.length)
      : (body.lengthCm !== undefined && body.lengthCm !== "" ? Number(body.lengthCm) : 30);
    const length = Number.isFinite(rawLength) ? rawLength : 30;

    const rawWidth = body.width !== undefined && body.width !== null && body.width !== ""
      ? Number(body.width)
      : (body.widthCm !== undefined && body.widthCm !== "" ? Number(body.widthCm) : 25);
    const width = Number.isFinite(rawWidth) ? rawWidth : 25;

    const rawHeight = body.height !== undefined && body.height !== null && body.height !== ""
      ? Number(body.height)
      : (body.heightCm !== undefined && body.heightCm !== "" ? Number(body.heightCm) : 8);
    const height = Number.isFinite(rawHeight) ? rawHeight : 8;

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

    /* =====================================================
       PACKAGE DIMENSIONS & WEIGHT VALIDATION
       ===================================================== */

    if (!Number.isFinite(weight) || weight <= 0) {
      return NextResponse.json(
        {
          error: "Product weight must be greater than 0 kg (e.g. 0.8 kg) for logistics and AWB generation.",
        },
        { status: 400 }
      );
    }

    if (!Number.isFinite(length) || length <= 0 || !Number.isFinite(width) || width <= 0 || !Number.isFinite(height) || height <= 0) {
      return NextResponse.json(
        {
          error: "Valid package dimensions (Length, Width, Height > 0 cm) are required.",
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
          error: "Invalid product price.",
        },
        { status: 400 }
      );
    }

    if (
      salePrice !== null &&
      (!Number.isFinite(salePrice) ||
        salePrice < 0)
    ) {
      return NextResponse.json(
        {
          error: "Invalid sale price.",
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

    if (
      !Object.values(ProductStatus).includes(
        status as ProductStatus
      )
    ) {
      return NextResponse.json(
        {
          error: "Invalid product status.",
        },
        { status: 400 }
      );
    }

    const existingProduct =
      await prisma.product.findUnique({
        where: {
          id,
        },
      });

    if (!existingProduct) {
      return NextResponse.json(
        {
          error: "Product not found.",
        },
        { status: 404 }
      );
    }

    const category =
      await prisma.category.findUnique({
        where: {
          id: categoryId,
        },
      });

    if (!category) {
      return NextResponse.json(
        {
          error: "Category not found.",
        },
        { status: 400 }
      );
    }

    const duplicateProduct =
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
          NOT: {
            id,
          },
        },
        select: {
          id: true,
          slug: true,
          sku: true,
        },
      });

    if (duplicateProduct) {
      if (
        duplicateProduct.slug === slug
      ) {
        return NextResponse.json(
          {
            error:
              "Another product already uses this slug.",
          },
          { status: 409 }
        );
      }

      if (
        duplicateProduct.sku === sku
      ) {
        return NextResponse.json(
          {
            error:
              "Another product already uses this SKU.",
          },
          { status: 409 }
        );
      }
    }

    const cleanedImages = images
      .map(
        (
          image: {
            url?: unknown;
            altText?: unknown;
          },
          index: number
        ) => ({
          url:
            typeof image.url === "string"
              ? image.url.trim()
              : "",
          altText:
            typeof image.altText === "string"
              ? image.altText.trim()
              : null,
          sortOrder: index,
        })
      )
      .filter(
        (image: { url: string }) =>
          image.url.length > 0
      );

    const cleanedVariants = variants

      .map(
        (
          variant: {
            size?: unknown;
            color?: unknown;
            stock?: unknown;
          }
        ) => ({
          size:
            typeof variant.size === "string"
              ? variant.size.trim()
              : "",
          color:
            typeof variant.color === "string"
              ? variant.color.trim()
              : null,
          stock:
            Number.isInteger(
              Number(variant.stock)
            ) &&
            Number(variant.stock) >= 0
              ? Number(variant.stock)
              : 0,
        })
      )
      .filter(
        (variant: { size: string }) =>
          variant.size.length > 0
      );
      const variantKeys = new Set<string>();

for (const variant of cleanedVariants) {
  const key = `${variant.size.toLowerCase()}::${(
    variant.color || ""
  ).toLowerCase()}`;

  if (variantKeys.has(key)) {
    return NextResponse.json(
      {
        error: `Duplicate variant: ${variant.size}${
          variant.color
            ? ` / ${variant.color}`
            : ""
        }. Each size and color combination must be unique.`,
      },
      { status: 400 }
    );
  }

  variantKeys.add(key);
}

    const updatedProduct =
      await prisma.$transaction(
        async (transaction) => {
          await transaction.productImage.deleteMany(
            {
              where: {
                productId: id,
              },
            }
          );

          await transaction.productVariant.deleteMany(
            {
              where: {
                productId: id,
              },
            }
          );

          return transaction.product.update({
            where: {
              id,
            },

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
              weight,
              length,
              width,
              height,
              status:
                status as ProductStatus,
              categoryId,

              images: {
                create: cleanedImages,
              },

              variants: {
                create: cleanedVariants,
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
        }
      );

    return NextResponse.json({
      success: true,
      product: updatedProduct,
    });
  } catch (error) {
    console.error(
      "ADMIN PRODUCT PATCH ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to update product.",
      },
      { status: 500 }
    );
  }
}

/* =========================================================
   DELETE PRODUCT
   ========================================================= */

export async function DELETE(
  request: Request,
  context: RouteContext
) {
  const valid = await requireAdmin(request);

  if (!valid) {
    return NextResponse.json(
      { error: "Unauthorized." },
      { status: 401 }
    );
  }

  try {
    const { id } = await context.params;

    const existingProduct = await prisma.product.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      return NextResponse.json(
        { error: "Product not found." },
        { status: 404 }
      );
    }

    // Delete product (cascades images and variants)
    await prisma.product.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Product deleted successfully.",
    });
  } catch (error) {
    console.error("ADMIN PRODUCT DELETE ERROR:", error);
    return NextResponse.json(
      { error: "Failed to delete product." },
      { status: 500 }
    );
  }
}