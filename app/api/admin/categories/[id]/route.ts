import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getAdminSessionCookieName,
  verifyAdminSession,
} from "@/lib/admin-auth";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

function getAdminTokenFromRequest(request: Request): string | undefined {
  const cookieHeader = request.headers.get("cookie") || "";
  return cookieHeader
    .split(";")
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(`${getAdminSessionCookieName()}=`))
    ?.split("=")
    .slice(1)
    .join("=");
}

export async function GET(request: Request, context: RouteContext) {
  const token = getAdminTokenFromRequest(request);
  const valid = await verifyAdminSession(token);

  if (!valid) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    if (!category) {
      return NextResponse.json({ error: "Category not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true, category });
  } catch (error) {
    console.error("ADMIN CATEGORY GET ERROR:", error);
    return NextResponse.json({ error: "Failed to load category." }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const token = getAdminTokenFromRequest(request);
  const valid = await verifyAdminSession(token);

  if (!valid) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const body = await request.json();
    const { name, slug, description, image } = body;

    const existing = await prisma.category.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Category not found." }, { status: 404 });
    }

    const cleanName = typeof name === "string" ? name.trim() : existing.name;
    const cleanSlug = typeof slug === "string" ? slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-") : existing.slug;

    if (cleanSlug !== existing.slug) {
      const duplicate = await prisma.category.findUnique({
        where: { slug: cleanSlug },
      });
      if (duplicate) {
        return NextResponse.json({ error: "Another category already uses this slug." }, { status: 409 });
      }
    }

    const category = await prisma.category.update({
      where: { id },
      data: {
        name: cleanName,
        slug: cleanSlug,
        description: description !== undefined ? (description ? description.trim() : null) : existing.description,
        image: image !== undefined ? (image ? image.trim() : null) : existing.image,
      },
    });

    return NextResponse.json({ success: true, category });
  } catch (error) {
    console.error("ADMIN CATEGORY UPDATE ERROR:", error);
    return NextResponse.json({ error: "Failed to update category." }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const token = getAdminTokenFromRequest(request);
  const valid = await verifyAdminSession(token);

  if (!valid) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const { id } = await context.params;

    const productsCount = await prisma.product.count({
      where: { categoryId: id },
    });

    if (productsCount > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete category. It currently contains ${productsCount} active product(s). Please reassign or delete the products first.`,
        },
        { status: 400 }
      );
    }

    await prisma.category.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Category deleted successfully.",
    });
  } catch (error) {
    console.error("ADMIN CATEGORY DELETE ERROR:", error);
    return NextResponse.json({ error: "Failed to delete category." }, { status: 500 });
  }
}
