"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import {
  getHomepageConfig,
  saveHomepageConfig,
  type HomepageCategorySectionConfig,
} from "@/lib/homepage-config";

async function requireAdmin(): Promise<boolean> {
  const session = await auth();
  return Boolean(session?.user?.id && session.user.role === "ADMIN");
}

export interface AdminActionResult {
  ok: boolean;
  message?: string;
}

export async function saveHomepageSectionAction(
  sectionInput: HomepageCategorySectionConfig
): Promise<AdminActionResult> {
  const isAdmin = await requireAdmin();
  if (!isAdmin) return { ok: false, message: "Unauthorized." };

  try {
    const config = await getHomepageConfig();
    const index = config.sections.findIndex(
      (s) => s.categoryId === sectionInput.categoryId
    );

    if (index >= 0) {
      config.sections[index] = {
        ...config.sections[index],
        ...sectionInput,
        title: sectionInput.title.trim() || config.sections[index].title,
        eyebrow: sectionInput.eyebrow?.trim() || "Studio Collection",
        subtitle: sectionInput.subtitle?.trim() || "",
        productIds: Array.isArray(sectionInput.productIds)
          ? sectionInput.productIds
          : [],
      };
    } else {
      config.sections.push(sectionInput);
    }

    await saveHomepageConfig(config);

    // Synchronize isFeatured in Prisma for the chosen products
    if (sectionInput.productIds && sectionInput.productIds.length > 0) {
      await prisma.product.updateMany({
        where: { id: { in: sectionInput.productIds } },
        data: { isFeatured: true },
      });
    }

    revalidatePath("/");
    revalidatePath("/admin/homepage");
    return { ok: true, message: `Updated section "${sectionInput.title}".` };
  } catch (err) {
    console.error("Failed to save homepage section:", err);
    return { ok: false, message: "Failed to save section changes." };
  }
}

export async function toggleCategoryHomepageAction(
  categoryId: string,
  enabled: boolean
): Promise<AdminActionResult> {
  const isAdmin = await requireAdmin();
  if (!isAdmin) return { ok: false, message: "Unauthorized." };

  try {
    const config = await getHomepageConfig();
    const sec = config.sections.find((s) => s.categoryId === categoryId);
    if (sec) {
      sec.enabled = enabled;
      await saveHomepageConfig(config);
      revalidatePath("/");
      revalidatePath("/admin/homepage");
      return {
        ok: true,
        message: `${sec.title} ${enabled ? "enabled" : "hidden"} on homepage.`,
      };
    }
    return { ok: false, message: "Category section not found." };
  } catch (err) {
    console.error("Failed to toggle category on homepage:", err);
    return { ok: false, message: "Failed to update category state." };
  }
}

export async function toggleProductHomepageAction(
  productId: string,
  categoryId: string,
  selected: boolean
): Promise<AdminActionResult> {
  const isAdmin = await requireAdmin();
  if (!isAdmin) return { ok: false, message: "Unauthorized." };

  try {
    const config = await getHomepageConfig();
    let sec = config.sections.find((s) => s.categoryId === categoryId);

    if (!sec) {
      const cat = await prisma.category.findUnique({
        where: { id: categoryId },
        select: { id: true, name: true, slug: true, description: true },
      });
      if (!cat) return { ok: false, message: "Category not found." };
      sec = {
        categoryId: cat.id,
        categorySlug: cat.slug,
        title: cat.name,
        eyebrow: "Studio Collection",
        subtitle: cat.description ?? "",
        enabled: true,
        sortOrder: config.sections.length,
        productIds: [],
        maxProducts: 6,
      };
      config.sections.push(sec);
    }

    const currentIds = new Set(sec.productIds || []);
    if (selected) {
      currentIds.add(productId);
    } else {
      currentIds.delete(productId);
    }
    sec.productIds = Array.from(currentIds);

    await saveHomepageConfig(config);

    // Keep Prisma isFeatured flag in sync
    await prisma.product.update({
      where: { id: productId },
      data: { isFeatured: selected },
    });

    revalidatePath("/");
    revalidatePath("/admin/homepage");
    return {
      ok: true,
      message: selected
        ? "Product added to homepage showcase."
        : "Product removed from homepage showcase.",
    };
  } catch (err) {
    console.error("Failed to toggle product homepage state:", err);
    return { ok: false, message: "Failed to update product." };
  }
}

export async function reorderHomepageSectionsAction(
  categoryIds: string[]
): Promise<AdminActionResult> {
  const isAdmin = await requireAdmin();
  if (!isAdmin) return { ok: false, message: "Unauthorized." };

  try {
    const config = await getHomepageConfig();
    const sectionMap = new Map(config.sections.map((s) => [s.categoryId, s]));
    const reordered: HomepageCategorySectionConfig[] = [];

    categoryIds.forEach((catId, index) => {
      const s = sectionMap.get(catId);
      if (s) {
        s.sortOrder = index;
        reordered.push(s);
        sectionMap.delete(catId);
      }
    });

    // Append any not explicitly in categoryIds list
    for (const remaining of sectionMap.values()) {
      remaining.sortOrder = reordered.length;
      reordered.push(remaining);
    }

    config.sections = reordered;
    await saveHomepageConfig(config);

    revalidatePath("/");
    revalidatePath("/admin/homepage");
    return { ok: true, message: "Homepage section order updated." };
  } catch (err) {
    console.error("Failed to reorder sections:", err);
    return { ok: false, message: "Failed to save order." };
  }
}
