"use client";

import { useState, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    ChevronLeft,
    Plus,
    Pencil,
    Trash2,
    FolderTree,
    ChevronRight,
    GripVertical,
    Image as ImageIcon,
    Upload,
    Grid,
    Loader2,
    CornerDownRight,
    X,
} from "lucide-react";
import Link from "next/link";
import { useCloudinaryUpload } from "@imaxis/cloudinary-convex/react";
import { ImageLibraryPicker } from "@/components/admin/ImageLibraryPicker";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface CategoryWithChildren {
    _id: Id<"categories">;
    name: string;
    slug: string;
    description?: string;
    imageUrl?: string;
    parentId?: Id<"categories">;
    sortOrder: number;
    children: CategoryWithChildren[];
}

interface SortableItemProps {
    category: CategoryWithChildren;
    depth: number;
    onEdit: (cat: CategoryWithChildren) => void;
    onDelete: (cat: CategoryWithChildren) => void;
    onAdd: (parent: CategoryWithChildren) => void;
}

function SortableCategoryItem({ category, depth, onEdit, onDelete, onAdd }: SortableItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: category._id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        paddingLeft: `${depth * 24 + 12}px`,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div ref={setNodeRef} style={style}>
            <div className={cn(
                "flex items-center gap-3 p-3 hover:bg-secondary/50 rounded-lg group transition-colors",
                isDragging && "bg-secondary"
            )}>
                <div {...attributes} {...listeners} className="cursor-grab hover:text-foreground text-muted-foreground transition-colors">
                    <GripVertical className="size-4" />
                </div>

                {category.imageUrl ? (
                    <div
                        className="size-10 rounded-lg bg-cover bg-center border border-border shrink-0"
                        style={{ backgroundImage: `url(${category.imageUrl})` }}
                    />
                ) : (
                    <div className="size-10 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                        <ImageIcon className="size-5 text-muted-foreground" />
                    </div>
                )}

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">{category.name}</span>
                        {category.children?.length > 0 && (
                            <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded">
                                {category.children.length} sub
                            </span>
                        )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                        /{category.slug}
                    </p>
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        onClick={() => onAdd(category)}
                        title="Add subcategory"
                    >
                        <Plus className="size-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        onClick={() => onEdit(category)}
                    >
                        <Pencil className="size-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-destructive hover:text-destructive"
                        onClick={() => onDelete(category)}
                    >
                        <Trash2 className="size-4" />
                    </Button>
                </div>
            </div>

            {/* Render children via SortableContext if any */}
            {category.children?.length > 0 && (
                <div className="border-l border-border ml-6">
                    <SortableContext
                        items={category.children.map((c) => c._id)}
                        strategy={verticalListSortingStrategy}
                    >
                        {category.children.map((child) => (
                            <SortableCategoryItem
                                key={child._id}
                                category={child}
                                depth={depth + 1}
                                onEdit={onEdit}
                                onDelete={onDelete}
                                onAdd={onAdd}
                            />
                        ))}
                    </SortableContext>
                </div>
            )}
        </div>
    );
}

export default function CategoriesPage() {
    const categories = useQuery(api.categories.list) as CategoryWithChildren[] | undefined;
    const createCategory = useMutation(api.categories.create);
    const updateCategory = useMutation(api.categories.update);
    const deleteCategory = useMutation(api.categories.remove);
    const reorderCategories = useMutation(api.categories.reorder);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }), // Require 8px movement
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id || !categories) return;

        // Helper to find parent array and item index
        const findContainer = (id: string, items: CategoryWithChildren[]): { container: CategoryWithChildren[], index: number } | null => {
            // Check root level
            const rootIndex = items.findIndex(item => item._id === id);
            if (rootIndex !== -1) return { container: items, index: rootIndex };

            // Check children recursively
            for (const item of items) {
                if (item.children) {
                    const result = findContainer(id, item.children);
                    if (result) return result;
                }
            }
            return null;
        };

        const activeInfo = findContainer(active.id as string, categories);
        const overInfo = findContainer(over.id as string, categories);

        if (!activeInfo || !overInfo) return;

        // Only allow reordering within the same container (same parent)
        if (activeInfo.container !== overInfo.container) {
            return; // Optionally handle reparenting here later
        }

        const oldIndex = activeInfo.index;
        const newIndex = overInfo.index;

        if (oldIndex !== newIndex) {
            // Optimistic Update (UI) - handled by DndKit while dragging, 
            // but we need to update backend to persist
            const newOrder = arrayMove(activeInfo.container, oldIndex, newIndex);
            
            // Map to backend update format
            const updates = newOrder.map((cat, index) => ({
                id: cat._id,
                sortOrder: index,
            }));

            try {
                await reorderCategories({ updates });
                // Note: Convex will automatically update the UI when query data changes
            } catch (err) {
                console.error("Failed to reorder:", err);
            }
        }
    };

    // Dialog states
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<CategoryWithChildren | null>(null);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [categoryToDelete, setCategoryToDelete] = useState<CategoryWithChildren | null>(null);

    // Form states
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [parentId, setParentId] = useState<string>("");
    const [image, setImage] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Image upload states
    const [isImagePickerOpen, setIsImagePickerOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Cloudinary upload
    let cloudinaryUpload: ReturnType<typeof useCloudinaryUpload> | null = null;
    try {
        cloudinaryUpload = useCloudinaryUpload(api.cloudinary.upload as any);
    } catch {
        // Cloudinary not configured
    }

    const resetForm = () => {
        setName("");
        setDescription("");
        setParentId("");
        setImage("");
        setError(null);
    };

    const openCreateDialog = (parent?: CategoryWithChildren) => {
        resetForm();
        setEditingCategory(null);
        if (parent) {
            setParentId(parent._id);
        }
        setIsDialogOpen(true);
    };

    const openEditDialog = (category: CategoryWithChildren) => {
        setEditingCategory(category);
        setName(category.name);
        setDescription(category.description || "");
        setParentId(category.parentId || "");
        setImage(category.imageUrl || "");
        setIsDialogOpen(true);
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0 || !cloudinaryUpload) return;

        try {
            const file = files[0];
            const result = await cloudinaryUpload.upload(file, {
                folder: "categories",
            });

            if (result) {
                const url = (result as any).secureUrl || (result as any).secure_url;
                setImage(url);
            }
        } catch (err) {
            console.error("Upload failed:", err);
            setError("Failed to upload image");
        } finally {
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };

    const handleSelectFromLibrary = (asset: { publicId: string; secureUrl: string }) => {
        setImage(asset.secureUrl);
        setIsImagePickerOpen(false);
    };

    const handleSave = async () => {
        if (!name.trim()) {
            setError("Name is required");
            return;
        }

        setIsSaving(true);
        setError(null);

        try {
            if (editingCategory) {
                await updateCategory({
                    id: editingCategory._id,
                    name: name.trim(),
                    description: description.trim() || undefined,
                    parentId: parentId && parentId !== "none" ? (parentId as Id<"categories">) : undefined,
                    imageUrl: image.trim() || undefined,
                });
            } else {
                await createCategory({
                    name: name.trim(),
                    description: description.trim() || undefined,
                    parentId: parentId && parentId !== "none" ? (parentId as Id<"categories">) : undefined,
                    imageUrl: image.trim() || undefined,
                });
            }
            setIsDialogOpen(false);
            resetForm();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to save category");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!categoryToDelete) return;

        try {
            await deleteCategory({ id: categoryToDelete._id });
            setDeleteConfirmOpen(false);
            setCategoryToDelete(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to delete category");
        }
    };

    const confirmDelete = (category: CategoryWithChildren) => {
        setCategoryToDelete(category);
        setDeleteConfirmOpen(true);
    };

    // Flatten categories for parent selector (exclude current category and its children)
    const getFlatCategories = (
        cats: CategoryWithChildren[],
        excludeId?: Id<"categories">
    ): { id: Id<"categories">; name: string; depth: number }[] => {
        const result: { id: Id<"categories">; name: string; depth: number }[] = [];

        const traverse = (items: CategoryWithChildren[], depth: number) => {
            for (const cat of items) {
                if (cat._id !== excludeId) {
                    result.push({ id: cat._id, name: cat.name, depth });
                    if (cat.children?.length) {
                        traverse(cat.children, depth + 1);
                    }
                }
            }
        };

        traverse(cats, 0);
        return result;
    };

    const flatCategories = categories ? getFlatCategories(categories, editingCategory?._id) : [];

    // Render category tree
    const renderCategory = (category: CategoryWithChildren, depth: number = 0) => (
        <div key={category._id}>
            <div
                className="flex items-center gap-3 p-3 hover:bg-secondary/50 rounded-lg group transition-colors"
                style={{ paddingLeft: `${depth * 24 + 12}px` }}
            >
                <GripVertical className="size-4 text-muted-foreground opacity-0 group-hover:opacity-100 cursor-grab" />

                {category.imageUrl ? (
                    <div
                        className="size-10 rounded-lg bg-cover bg-center border border-border"
                        style={{ backgroundImage: `url(${category.imageUrl})` }}
                    />
                ) : (
                    <div className="size-10 rounded-lg bg-secondary flex items-center justify-center">
                        <ImageIcon className="size-5 text-muted-foreground" />
                    </div>
                )}

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">{category.name}</span>
                        {category.children?.length > 0 && (
                            <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded">
                                {category.children.length} sub
                            </span>
                        )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                        /{category.slug}
                    </p>
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        onClick={() => openCreateDialog(category)}
                        title="Add subcategory"
                    >
                        <Plus className="size-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        onClick={() => openEditDialog(category)}
                    >
                        <Pencil className="size-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-destructive hover:text-destructive"
                        onClick={() => confirmDelete(category)}
                    >
                        <Trash2 className="size-4" />
                    </Button>
                </div>
            </div>

            {/* Render children */}
            {category.children?.map((child) => renderCategory(child, depth + 1))}
        </div>
    );

    // Get upload state directly from the hook
    const isUploading = cloudinaryUpload?.isUploading ?? false;
    const uploadProgress = cloudinaryUpload?.progress ?? 0;

    return (
        <>
            <main className="min-h-screen bg-background">
                {/* Header */}
                <div className="border-b border-border bg-card">
                    <div className="max-w-[1400px] mx-auto px-6 py-4">
                        <div className="flex items-center gap-4">
                            <Link href="/admin/products">
                                <Button variant="ghost" size="icon" className="size-9">
                                    <ChevronLeft className="size-5" />
                                </Button>
                            </Link>
                            <div className="flex-1">
                                <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                                    <Link href="/admin" className="hover:text-foreground">
                                        Admin
                                    </Link>
                                    <ChevronRight className="size-3" />
                                    <Link href="/admin/products" className="hover:text-foreground">
                                        Products
                                    </Link>
                                    <ChevronRight className="size-3" />
                                    <span className="text-foreground">Categories</span>
                                </nav>
                                <h1 className="text-2xl font-bold text-foreground">
                                    Product Categories
                                </h1>
                            </div>
                            <Button
                                className="gap-2"
                                onClick={() => openCreateDialog()}
                            >
                                <Plus className="size-4" />
                                Add Category
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="max-w-[1400px] mx-auto px-6 py-8">
                    <div className="bg-card border border-border rounded-xl overflow-hidden">
                        {!categories ? (
                            <div className="p-12 text-center text-muted-foreground">
                                Loading categories...
                            </div>
                        ) : categories.length === 0 ? (
                            <div className="p-12 text-center">
                                <FolderTree className="size-12 mx-auto text-muted-foreground mb-4" />
                                <h3 className="text-lg font-semibold mb-2">No categories yet</h3>
                                <p className="text-muted-foreground mb-4">
                                    Create your first category to organize your products
                                </p>
                                <Button onClick={() => openCreateDialog()}>
                                    <Plus className="size-4 mr-2" />
                                    Create Category
                                </Button>
                            </div>
                        ) : (
                            <DndContext
                                sensors={sensors}
                                collisionDetection={closestCenter}
                                onDragEnd={handleDragEnd}
                            >
                                <div className="divide-y divide-border">
                                    <SortableContext
                                        items={categories.map((c) => c._id)}
                                        strategy={verticalListSortingStrategy}
                                    >
                                        {categories.map((cat) => (
                                            <SortableCategoryItem
                                                key={cat._id}
                                                category={cat}
                                                depth={0}
                                                onEdit={openEditDialog}
                                                onDelete={confirmDelete}
                                                onAdd={openCreateDialog}
                                            />
                                        ))}
                                    </SortableContext>
                                </div>
                            </DndContext>
                        )}
                    </div>
                </div>

                {/* Create/Edit Dialog */}
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle>
                                {editingCategory ? "Edit Category" : "Create Category"}
                            </DialogTitle>
                        </DialogHeader>

                        <div className="space-y-4 py-4">
                            {error && (
                                <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-lg">
                                    {error}
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="name">Name *</Label>
                                <Input
                                    id="name"
                                    placeholder="e.g. Electronics, Clothing"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    placeholder="Brief description of this category"
                                    rows={3}
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="parent">Parent Category</Label>
                                <Select value={parentId} onValueChange={setParentId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="None (top-level)" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">None (top-level)</SelectItem>
                                        {flatCategories.map((cat) => (
                                            <SelectItem className="group" key={cat.id} value={cat.id}>
                                                <span className="flex items-center">
                                                    {cat.depth > 0 && (
                                                        <span className="flex mr-2 text-muted-foreground" style={{ width: `${cat.depth * 20}px` }}>
                                                            <span className="flex-1" />
                                                            <CornerDownRight className="size-4 opacity-50 mb-0.5 ml-auto group-hover:text-primary transition-colors" />
                                                        </span>
                                                    )}
                                                    {cat.name}
                                                </span>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Category Image</Label>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleImageUpload}
                                />

                                {image ? (
                                    <div className="relative">
                                        <div
                                            className="h-32 rounded-lg bg-cover bg-center border border-border"
                                            style={{ backgroundImage: `url(${image})` }}
                                        />
                                        <button
                                            type="button"
                                            className="absolute top-2 right-2 p-1 bg-black/50 hover:bg-black/70 rounded-full text-white"
                                            onClick={() => setImage("")}
                                        >
                                            <X className="size-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <div className="flex gap-2">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                className="flex-1 gap-2"
                                                onClick={() => fileInputRef.current?.click()}
                                                disabled={isUploading}
                                            >
                                                {isUploading ? (
                                                    <>
                                                        <Loader2 className="size-4 animate-spin" />
                                                        {uploadProgress}%
                                                    </>
                                                ) : (
                                                    <>
                                                        <Upload className="size-4" />
                                                        Upload
                                                    </>
                                                )}
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                className="flex-1 gap-2"
                                                onClick={() => setIsImagePickerOpen(true)}
                                            >
                                                <Grid className="size-4" />
                                                Library
                                            </Button>
                                        </div>
                                        <p className="text-xs text-muted-foreground text-center">
                                            Or paste an image URL below
                                        </p>
                                        <Input
                                            placeholder="https://example.com/image.jpg"
                                            value={image}
                                            onChange={(e) => setImage(e.target.value)}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        <DialogFooter>
                            <Button
                                variant="outline"
                                onClick={() => setIsDialogOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button onClick={handleSave} disabled={isSaving}>
                                {isSaving ? "Saving..." : editingCategory ? "Save Changes" : "Create"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Delete Confirmation */}
                <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Delete Category</AlertDialogTitle>
                            <AlertDialogDescription>
                                Are you sure you want to delete "{categoryToDelete?.name}"?
                                {categoryToDelete?.children?.length ? (
                                    <span className="block mt-2 text-destructive">
                                        Warning: This category has {categoryToDelete.children.length} subcategories
                                        that will also be affected.
                                    </span>
                                ) : null}
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={handleDelete}
                                className="bg-destructive hover:bg-destructive/90"
                            >
                                Delete
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </main>

            {/* Image Library Picker */}
            <ImageLibraryPicker
                open={isImagePickerOpen}
                onOpenChange={setIsImagePickerOpen}
                selectedImages={image ? [{ publicId: "", url: image, isMain: false }] : []}
                onSelectImage={handleSelectFromLibrary}
            />
        </>
    );
}
