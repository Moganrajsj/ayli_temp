"use client";

import { useState, type FormEvent } from "react";
import {
  createCategoryAction,
  updateCategoryAction,
  createSubcategoryAction,
  deleteSubcategoryAction,
} from "@/actions/admin.action";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/field";
import { Icon } from "@/components/ui/icons";

export interface AdminSubcatRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
}

export interface AdminCategoryRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
  subcategories: AdminSubcatRow[];
}

interface CategoryManagerProps {
  initial: AdminCategoryRow[];
}

type Feedback = { id: string; kind: "ok" | "error"; message: string } | null;

export function CategoryManager({ initial }: CategoryManagerProps) {
  const [categories, setCategories] = useState(initial);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback>(null);

  function show(f: Feedback) {
    setFeedback(f);
    window.setTimeout(() => setFeedback(null), 4000);
  }

  function syncCategory(id: string, patch: Partial<AdminCategoryRow>) {
    setCategories((cats) => cats.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  }

  async function onCreateCategory(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const res = await createCategoryAction(new FormData(e.currentTarget));
    show({ id: "category-create", kind: res.ok ? "ok" : "error", message: res.message ?? "" });
    if (res.ok) {
      e.currentTarget.reset();
      // Pull fresh data so the new row appears. (Real server refresh below.)
      window.location.reload();
    }
  }

  async function onSaveCategory(id: string, formData: FormData) {
    const res = await updateCategoryAction(id, formData);
    show({ id, kind: res.ok ? "ok" : "error", message: res.message ?? "Please check the fields." });
    if (res.ok) {
      syncCategory(id, {
        name: String(formData.get("name") ?? ""),
        slug: String(formData.get("slug") ?? ""),
        description: String(formData.get("description") ?? "") || null,
        sortOrder: Number(formData.get("sortOrder") ?? 0),
        isActive: formData.get("isActive") === "on",
      });
    }
  }

  async function onCreateSubcategory(categoryId: string, e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set("categoryId", categoryId);
    const res = await createSubcategoryAction(fd);
    show({ id: `${categoryId}-sub-create`, kind: res.ok ? "ok" : "error", message: res.message ?? "" });
    if (res.ok) window.location.reload();
  }

  return (
    <div>
      {feedback ? (
        <div
          role={feedback.kind === "error" ? "alert" : "status"}
          className={`mb-4 rounded-card border px-4 py-3 text-sm ${
            feedback.kind === "ok" ? "border-success/30 bg-success/5 text-success" : "border-danger/30 bg-danger/5 text-danger"
          }`}
        >
          {feedback.message}
        </div>
      ) : null}

      {/* New category */}
      <section className="rounded-card border border-hairline bg-warm-white p-5 shadow-soft">
        <h2 className="mb-4 font-display text-lg font-semibold tracking-tight text-ink">New category</h2>
        <form onSubmit={onCreateCategory} className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <Input label="Name" name="name" required />
            <Input
              label="Slug"
              name="slug"
              required
              pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
              hint="Lowercase, hyphens."
            />
            <label className="flex items-center gap-2.5 text-sm font-medium text-ink sm:pt-8">
              <input name="isActive" type="checkbox" defaultChecked className="h-4 w-4 accent-[#22c0d4]" />
              Active
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Sort order" name="sortOrder" type="number" min="0" defaultValue="0" />
            <Textarea label="Description" name="description" rows={2} />
          </div>
          <div>
            <Button type="submit" size="md">
              <Icon name="plus" className="h-4 w-4" />
              Create category
            </Button>
          </div>
        </form>
      </section>

      {/* Category list */}
      <div className="mt-6 flex flex-col gap-5">
        {categories.length === 0 ? (
          <p className="rounded-card border border-dashed border-hairline px-4 py-10 text-center text-sm text-muted">
            No categories yet.
          </p>
        ) : null}
        {categories.map((cat) => {
          const isOpen = expanded === cat.id;
          return (
            <section key={cat.id} className="rounded-card border border-hairline bg-warm-white shadow-soft">
              <div className="flex items-center gap-3 p-4">
                <span className="relative">
                  <span
                    className={`grid h-10 w-10 place-items-center rounded-full ${
                      cat.isActive ? "bg-ayli-blue/10 text-ayli-blue" : "bg-soft-beige text-muted"
                    }`}
                  >
                    <Icon name="briefcase" className="h-5 w-5" />
                  </span>
                  {cat.isActive ? (
                    <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-warm-white bg-success" />
                  ) : null}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-display font-medium text-ink">{cat.name}</p>
                  <p className="text-xs text-muted">
                    /{cat.slug} · {cat.subcategories.length} subcategor
                    {cat.subcategories.length === 1 ? "y" : "ies"}· sort {cat.sortOrder}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setExpanded(isOpen ? null : cat.id)}
                  aria-expanded={isOpen}
                >
                  <Icon name={isOpen ? "chevron-down" : "chevron-right"} className="h-5 w-5" />
                  <span className="ml-1">{isOpen ? "Close" : "Manage"}</span>
                </Button>
              </div>

              {isOpen ? (
                <div className="grid gap-6 border-t border-hairline/70 p-4 lg:grid-cols-2">
                  <form
                    action={async (fd) => {
                      await onSaveCategory(cat.id, fd);
                    }}
                    className="flex flex-col gap-3"
                  >
                    <h3 className="text-sm font-semibold uppercase tracking-widest text-muted">Edit category</h3>
                    <Input label="Name" name="name" defaultValue={cat.name} required />
                    <Input label="Slug" name="slug" defaultValue={cat.slug} required />
                    <div className="grid grid-cols-2 gap-3">
                      <Input label="Sort order" name="sortOrder" type="number" min="0" defaultValue={String(cat.sortOrder)} />
                      <label className="flex items-center gap-2.5 text-sm font-medium text-ink sm:pt-8">
                        <input name="isActive" type="checkbox" defaultChecked={cat.isActive} className="h-4 w-4 accent-[#22c0d4]" />
                        Active
                      </label>
                    </div>
                    <Textarea label="Description" name="description" rows={2} defaultValue={cat.description ?? ""} />
                    <Button type="submit" variant="secondary" size="sm" className="self-start">
                      Save category
                    </Button>
                  </form>

                  <div>
                    <h3 className="mb-3 text-sm font-semibold uppercase tracking-widest text-muted">Subcategories</h3>
                    <form
                      onSubmit={(e) => onCreateSubcategory(cat.id, e)}
                      className="mb-4 flex flex-wrap items-end gap-2"
                    >
                      <Input name="name" placeholder="Subcategory name" required className="max-w-44" />
                      <Input name="slug" placeholder="sub-slug" required className="max-w-32" pattern="[a-z0-9]+(?:-[a-z0-9]+)*" />
                      <Input name="sortOrder" type="number" min="0" defaultValue="0" className="max-w-20" aria-label="Sort order" />
                      <Button type="submit" size="sm">
                        <Icon name="plus" className="h-4 w-4" />
                        Add
                      </Button>
                    </form>

                    {cat.subcategories.length === 0 ? (
                      <p className="text-sm text-muted">No subcategories yet.</p>
                    ) : (
                      <ul className="flex flex-col gap-2">
                        {cat.subcategories.map((sub) => (
                          <li
                            key={sub.id}
                            className={`flex items-center gap-3 rounded-card border px-3 py-2 text-sm ${
                              sub.isActive ? "border-hairline" : "border-hairline opacity-60"
                            }`}
                          >
                            <div className="min-w-0 flex-1">
                              <p className="truncate font-medium text-ink">{sub.name}</p>
                              <p className="truncate text-xs text-muted">/{sub.slug}</p>
                            </div>
                            <form
                              action={async () => {
                                const res = await deleteSubcategoryAction(sub.id);
                                show({ id: sub.id, kind: res.ok ? "ok" : "error", message: res.message ?? "" });
                                if (res.ok) {
                                  setCategories((cats) =>
                                    cats.map((c) =>
                                      c.id === cat.id
                                        ? { ...c, subcategories: c.subcategories.filter((s) => s.id !== sub.id) }
                                        : c,
                                    ),
                                  );
                                }
                              }}
                            >
                              <Button type="submit" variant="ghost" size="sm" aria-label={`Delete ${sub.name}`}>
                                <Icon name="trash" className="h-4 w-4 text-danger" />
                              </Button>
                            </form>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              ) : null}
            </section>
          );
        })}
      </div>
    </div>
  );
}