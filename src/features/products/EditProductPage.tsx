import { toast } from 'react-toastify';
import { BackButton } from '../../components/common/BackButton';
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import styles from './ProductStyles.module.css';
import { DatePicker } from '../../components/common/DatePicker';
import {
  productManagementApi,
  getAssetUrl,
  type CategoryItem,
  type BrandItem,
} from './productManagementApi';
import { tagApi } from '../tags/tagApi';
import { categoryApi } from '../categories/categoryApi';
import { createBrand, type BrandRequest } from '../brand/brandApi';
import { CategoryFormModal } from '../categories/CategoryFormModal';
import { BrandModal } from '../brand/BrandModels';
import type { CategoryRequestDto, CategoryResponseDto } from '../../types/category';
import { inventoryApi } from '../inventory/inventoryApi';
import { variantApi } from '../variants/variantApi';
import {
  FiPackage,
  FiTag,
  FiSliders,
  FiX,
  FiCheck,
  FiAlertCircle,
  FiClock,
  FiSave,
  FiUploadCloud,
  FiTrash2,
  FiStar,
  FiRefreshCw,
  FiPlus,
} from 'react-icons/fi';

const ATTRIBUTE_PRESETS: Record<string, string[]> = {
  color: ['White', 'Black', 'Yellow', 'Red', 'Blue', 'Green', 'Grey', 'Navy', 'Silver', 'Gold'],
  size: ['S', 'M', 'L', 'XL', 'XXL', '45cm x 5M'],
  storage: ['64GB', '128GB', '256GB', '512GB', '1TB'],
  material: ['Cotton', 'Leather', 'Polyester', 'Silk', 'Denim'],
};

const COLOR_MAP: Record<string, string> = {
  black: '#000000',
  gold: '#d4af37',
  olive: '#808000',
  clear: '#f1f5f9',
  silver: '#cbd5e1',
  white: '#ffffff',
  yellow: '#eab308',
  red: '#ef4444',
  blue: '#3b82f6',
  green: '#22c55e',
  grey: '#94a3b8',
  gray: '#94a3b8',
  navy: '#1e3a8a',
  purple: '#a855f7',
  pink: '#ec4899',
  orange: '#f97316',
};

const getColorHex = (name: string): string => {
  const clean = name.toLowerCase().trim();
  return COLOR_MAP[clean] || (clean.startsWith('#') ? clean : '#94a3b8');
};

interface LocalAttribute {
  id: string | number;
  name: string;
  values: string[];
}

export interface NewGeneratedVariant {
  id: string;
  sku: string;
  combination: Array<{ attrName: string; value: string }>;
  price: string | number;
  costPrice?: string | number;
  stock: string | number;
  images: File[];
  imagePreviews: string[];
}

const generateVariantSku = (
  index: number,
  combination: Array<{ attrName: string; value: string }>,
  prodName: string
) => {
  const prefix = prodName
    ? prodName.replace(/[^a-zA-Z0-9]/g, '').slice(0, 6).toUpperCase() || 'PROD'
    : 'PROD';

  let comboCode = '';
  combination.forEach((c) => {
    const val = c.value.trim().toUpperCase();
    if (val === 'WHITE') comboCode += 'W';
    else if (val === 'BLACK') comboCode += 'B';
    else if (val.length <= 2) comboCode += val;
    else comboCode += val.slice(0, 2);
  });

  const numPart = String(index + 1).padStart(3, '0');
  return `${prefix}-${comboCode || 'V'}-${numPart}`;
};

export const EditProductPage: React.FC = () => {
  const { id: pathId } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();

  const stateId = (location.state as any)?.productId || (location.state as any)?.id;
  const storedId = sessionStorage.getItem('activeEditProductId');
  const id = stateId || searchParams.get('id') || pathId || storedId;
  const productId = Number(id);

  useEffect(() => {
    if (id) {
      sessionStorage.setItem('activeEditProductId', String(id));
    }
  }, [id]);

  // Loading & Submission states
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');

  // Form Fields
  const [productName, setProductName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [status, setStatus] = useState<string>('ACTIVE');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedBrand, setSelectedBrand] = useState<string>('');

  // Dropdown Lookups
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [brands, setBrands] = useState<BrandItem[]>([]);
  const [allCategoriesFull, setAllCategoriesFull] = useState<CategoryResponseDto[]>([]);

  // Expiration & Perishable tracking
  const [isPerishable, setIsPerishable] = useState<boolean>(false);
  const [expiryDate, setExpiryDate] = useState<string>('');
  const [batchNumber, setBatchNumber] = useState<string>('');

  // Tags
  const [allTags, setAllTags] = useState<Array<{ tagId: number; tagName: string }>>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [showTagModal, setShowTagModal] = useState<boolean>(false);
  const [newTagName, setNewTagName] = useState<string>('');
  const [tagLoading, setTagLoading] = useState<boolean>(false);

  // Images
  const [existingImages, setExistingImages] = useState<Array<{ imageId: number; imageUrl: string; isPrimary: boolean }>>([]);
  const [newImageFiles, setNewImageFiles] = useState<File[]>([]);
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([]);
  const [replacingTarget, setReplacingTarget] = useState<{ imageId: number; isPrimary: boolean } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);

  // Quick Modals
  const [showCategoryModal, setShowCategoryModal] = useState<boolean>(false);
  const [categoryFormData, setCategoryFormData] = useState<CategoryRequestDto>({
    categoryName: '',
    description: '',
    parentId: null,
  });
  const [catLoading, setCatLoading] = useState<boolean>(false);
  const [categoryModalError, setCategoryModalError] = useState<string | null>(null);

  const [showBrandModal, setShowBrandModal] = useState<boolean>(false);
  const [brandLoading, setBrandLoading] = useState<boolean>(false);

  // ==========================================
  // 1. EXISTING ASSOCIATED VARIANTS STATE
  // ==========================================
  const [existingVariants, setExistingVariants] = useState<any[]>([]);
  const [savingVariantId, setSavingVariantId] = useState<number | null>(null);

  // ==========================================
  // 2. PRODUCT VARIATIONS BUILDER (ADD NEW VARIANTS)
  // (Starts UNCHECKED and EMPTY on load - only opens when user checks the box)
  // ==========================================
  const [hasVariants, setHasVariants] = useState<boolean>(false);
  const [attributes, setAttributes] = useState<LocalAttribute[]>([]);
  const [availableAttributes, setAvailableAttributes] = useState<string[]>([
    'Color',
    'Size',
    'Storage',
    'Material',
  ]);
  const [selectedExistingAttr, setSelectedExistingAttr] = useState<string>('');
  const [showAddAttrInput, setShowAddAttrInput] = useState<boolean>(false);
  const [customAttrName, setCustomAttrName] = useState<string>('');
  const [inlineValues, setInlineValues] = useState<{ [key: string | number]: string }>({});
  const [generatedVariants, setGeneratedVariants] = useState<NewGeneratedVariant[]>([]);

  // Computed count of combinations from active attributes
  
  // Load all product details
  useEffect(() => {
    if (!productId || isNaN(productId)) {
      setErrorMessage('Invalid Product ID.');
      setLoading(false);
      return;
    }
    fetchProductDetails();
  }, [productId]);

  const fetchProductDetails = async () => {
    try {
      setLoading(true);
      setErrorMessage('');

      // 1. Fetch Lookups
      const [catsRes, brandsRes, tagsRes, fullCatsRes, varsRes] = await Promise.allSettled([
        productManagementApi.getCategories(),
        productManagementApi.getBrands(),
        tagApi.getAllTags(0, 100),
        categoryApi.getAllCategories(0, 1000),
        variantApi.getVariations(),
      ]);

      if (catsRes.status === 'fulfilled') setCategories(catsRes.value);
      if (brandsRes.status === 'fulfilled') setBrands(brandsRes.value);
      if (tagsRes.status === 'fulfilled' && tagsRes.value?.content) {
        setAllTags(tagsRes.value.content.map((t: any) => ({ tagId: t.tagId, tagName: t.tagName })));
      }
      if (fullCatsRes.status === 'fulfilled' && fullCatsRes.value?.content) {
        setAllCategoriesFull(fullCatsRes.value.content);
      }
      if (varsRes.status === 'fulfilled' && Array.isArray(varsRes.value)) {
        const varNames = varsRes.value.map((v: any) => v.name);
        setAvailableAttributes((prev) => Array.from(new Set([...prev, ...varNames])));
      }

      // 2. Fetch Product Info
      const prod = await productManagementApi.getProductById(productId);
      setProductName(prod.productName || '');
      setDescription(prod.description || '');
      setStatus(prod.status || 'ACTIVE');
      if (prod.categoryId) setSelectedCategory(String(prod.categoryId));
      if (prod.brandId) setSelectedBrand(String(prod.brandId));

      // 3. Fetch Images
      try {
        const imgs = await productManagementApi.getProductImages(productId);
        setExistingImages(imgs || []);
      } catch {
        setExistingImages([]);
      }

      // 4. Fetch Tags
      try {
        const prodTags = await productManagementApi.getProductTags(productId);
        if (Array.isArray(prodTags)) {
          setSelectedTagIds(prodTags.map((pt: any) => pt.tag?.tagId || pt.tagId).filter(Boolean));
        }
      } catch {
        setSelectedTagIds([]);
      }

      // 5. Fetch Existing Variants (cleanly stored for Existing Variants card, NO auto-generation)
      try {
        const vars = await productManagementApi.getVariantsByProductId(productId);
        if (Array.isArray(vars) && vars.length > 0) {
          const withImgs = await Promise.all(
            vars.map(async (v: any) => {
              try {
                const varImgs = await productManagementApi.getVariantImages(v.variantId);
                return { ...v, images: Array.isArray(varImgs) ? varImgs : [] };
              } catch {
                return { ...v, images: [] };
              }
            })
          );
          setExistingVariants(withImgs);

          // Check inventory of first variant for perishable details
          try {
            const firstVariantId = vars[0].variantId;
            const inv = await inventoryApi.getInventoryByVariantId(firstVariantId);
            if (inv) {
              setIsPerishable(Boolean(inv.isPerishable));
              if (inv.expiryDate) setExpiryDate(inv.expiryDate);
              if (inv.batchNumber) setBatchNumber(inv.batchNumber);
            }
          } catch {
            // Optional
          }
        } else {
          setExistingVariants([]);
        }
      } catch {
        setExistingVariants([]);
      }

      // Product Variations builder starts clean and unchecked!
      setHasVariants(false);
      setAttributes([]);
      setGeneratedVariants([]);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load product details');
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // Handlers for Existing Variants
  // ==========================================
  const handleExistingVariantFieldChange = (variantId: number, field: string, value: any) => {
    setExistingVariants((prev) =>
      prev.map((v) => (v.variantId === variantId ? { ...v, [field]: value } : v))
    );
  };

  const handleSaveExistingVariant = async (v: any) => {
    try {
      setSavingVariantId(v.variantId);
      await variantApi.updateProductVariant(v.variantId, {
        sku: v.sku, // Read-only / preserved
        sellingPrice: Number(v.sellingPrice) || 0,
        costPrice: v.costPrice !== undefined && v.costPrice !== '' ? Number(v.costPrice) : undefined,
        status: v.status || 'ACTIVE',
      });
      toast.success(`Variant ${v.sku || '#' + v.variantId} updated successfully!`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to update variant');
    } finally {
      setSavingVariantId(null);
    }
  };

  const handleToggleExistingVariantStatus = async (variantId: number, currentStatus: string) => {
    const nextStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      const v = existingVariants.find((item) => item.variantId === variantId);
      if (!v) return;
      await variantApi.updateProductVariant(variantId, {
        sku: v.sku,
        sellingPrice: Number(v.sellingPrice) || 0,
        costPrice: v.costPrice ? Number(v.costPrice) : undefined,
        status: nextStatus,
      });
      setExistingVariants((prev) =>
        prev.map((item) => (item.variantId === variantId ? { ...item, status: nextStatus } : item))
      );
      toast.success(`Variant status changed to ${nextStatus}`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to change variant status');
    }
  };

  const handleUploadExistingVariantPhoto = async (variantId: number, file: File) => {
    try {
      const uploaded = await productManagementApi.uploadProductVariantImage(variantId, file);
      const newImgObj = {
        productVariantImageId: uploaded.productVariantImageId,
        imageUrl: uploaded.imageUrl,
        isPrimary: Boolean(uploaded.isPrimary),
      };
      setExistingVariants((prev) =>
        prev.map((v) =>
          v.variantId === variantId
            ? { ...v, images: [...(v.images || []), newImgObj] }
            : v
        )
      );
      toast.success('Variant photo added successfully!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to upload photo');
    }
  };

  const handleDeleteExistingVariantPhoto = async (variantId: number, imageId: number) => {
    try {
      await productManagementApi.deleteVariantImage(imageId);
      setExistingVariants((prev) =>
        prev.map((v) =>
          v.variantId === variantId
            ? { ...v, images: (v.images || []).filter((img: any) => img.productVariantImageId !== imageId) }
            : v
        )
      );
      toast.success('Variant photo removed!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to remove variant photo');
    }
  };

  // ==========================================
  // Handlers for Product Variations Builder (Add New Variants)
  // ==========================================
  const generateCombosFromAttrs = (currentAttrs: LocalAttribute[]) => {
    const activeAttrs = currentAttrs.filter((a) => a.values && a.values.length > 0);
    if (activeAttrs.length === 0) {
      setGeneratedVariants([]);
      return;
    }

    type Item = { attrName: string; value: string };
    const attrChoices: Item[][] = activeAttrs.map((attr) =>
      attr.values.map((v) => ({ attrName: attr.name, value: v }))
    );

    const cartesianCombos = (arrays: Item[][]): Item[][] => {
      return arrays.reduce<Item[][]>(
        (acc, curr) => acc.flatMap((c) => curr.map((n) => [...c, n])),
        [[]]
      );
    };

    const combos = cartesianCombos(attrChoices);
    const activeName = productName || 'PROD';

    setGeneratedVariants((prev) => {
      return combos.map((combo, idx) => {
        const comboKey = combo
          .map((c) => `${c.attrName.toLowerCase()}:${c.value.toLowerCase()}`)
          .sort()
          .join('|');

        const existing = prev.find((v) => {
          const key = v.combination
            .map((c) => `${c.attrName.toLowerCase()}:${c.value.toLowerCase()}`)
            .sort()
            .join('|');
          return key === comboKey;
        });

        if (existing) {
          return existing;
        }

        return {
          id: `new-${idx + 1}-${comboKey}`,
          sku: generateVariantSku(existingVariants.length + idx, combo, activeName),
          combination: combo,
          price: '',
          costPrice: '',
          stock: 25,
          images: [],
          imagePreviews: [],
        };
      });
    });
  };

  const handleToggleHasVariants = (checked: boolean) => {
    setHasVariants(checked);
    if (!checked) {
      setAttributes([]);
      setGeneratedVariants([]);
    }
  };

  // Real-time reactive auto-generation of variant cards whenever attributes change (e.g. clicking color card)
  useEffect(() => {
    if (hasVariants) {
      generateCombosFromAttrs(attributes);
    } else {
      setGeneratedVariants([]);
    }
  }, [attributes, hasVariants]);

  
  const handleAddPresetValue = (attrId: string | number, value: string) => {
    setAttributes((prev) =>
      prev.map((attr) => {
        if (attr.id === attrId) {
          if (attr.values.some((v) => v.toLowerCase() === value.toLowerCase())) {
            return attr;
          }
          return { ...attr, values: [...attr.values, value] };
        }
        return attr;
      })
    );
  };

  const handleAddValueToAttr = (attrId: string | number) => {
    const val = inlineValues[attrId]?.trim();
    if (!val) return;

    setAttributes((prev) =>
      prev.map((attr) => {
        if (attr.id === attrId) {
          if (attr.values.some((v) => v.toLowerCase() === val.toLowerCase())) {
            return attr;
          }
          return { ...attr, values: [...attr.values, val] };
        }
        return attr;
      })
    );
    setInlineValues((prev) => ({ ...prev, [attrId]: '' }));
  };

  const handleRemoveValue = (attrId: string | number, valueToRemove: string) => {
    setAttributes((prev) =>
      prev.map((attr) =>
        attr.id === attrId
          ? { ...attr, values: attr.values.filter((v) => v !== valueToRemove) }
          : attr
      )
    );
  };

  const handleRemoveAttribute = (attrId: string | number) => {
    setAttributes((prev) => prev.filter((attr) => attr.id !== attrId));
  };

  const handleAddExistingAttribute = () => {
    if (!selectedExistingAttr) return;
    if (attributes.some((a) => a.name.toLowerCase() === selectedExistingAttr.toLowerCase())) {
      toast.warning('This attribute is already added.');
      return;
    }

    const updated: LocalAttribute[] = [
      ...attributes,
      {
        id: Date.now(),
        name: selectedExistingAttr,
        values: [],
      },
    ];
    setAttributes(updated);
    setSelectedExistingAttr('');
  };

  const handleAddCustomAttribute = () => {
    if (!customAttrName.trim()) return;
    if (attributes.some((a) => a.name.toLowerCase() === customAttrName.trim().toLowerCase())) {
      toast.warning('Attribute already exists.');
      return;
    }

    const updated: LocalAttribute[] = [
      ...attributes,
      {
        id: Date.now(),
        name: customAttrName.trim(),
        values: [],
      },
    ];
    setAttributes(updated);
    setCustomAttrName('');
    setShowAddAttrInput(false);
  };

  const handleDeleteGeneratedVariant = (id: string) => {
    setGeneratedVariants((prev) => prev.filter((v) => v.id !== id));
  };

  const handleVariantFieldChange = (id: string, field: 'price' | 'costPrice' | 'stock', value: string) => {
    setGeneratedVariants((prev) =>
      prev.map((v) => (v.id === id ? { ...v, [field]: value } : v))
    );
  };

  const handleVariantImagesUpload = (id: string, files: FileList | null) => {
    if (!files) return;
    const newFiles = Array.from(files);
    const newUrls = newFiles.map((f) => URL.createObjectURL(f));

    setGeneratedVariants((prev) =>
      prev.map((v) =>
        v.id === id
          ? {
              ...v,
              images: [...v.images, ...newFiles],
              imagePreviews: [...v.imagePreviews, ...newUrls],
            }
          : v
      )
    );
  };

  const handleRemoveVariantImage = (id: string, indexToRemove: number) => {
    setGeneratedVariants((prev) =>
      prev.map((v) => {
        if (v.id !== id) return v;
        return {
          ...v,
          images: v.images.filter((_, idx) => idx !== indexToRemove),
          imagePreviews: v.imagePreviews.filter((_, idx) => idx !== indexToRemove),
        };
      })
    );
  };

  // Image Upload Handlers
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const newFiles = Array.from(files);
    setNewImageFiles((prev) => [...prev, ...newFiles]);
    const previews = newFiles.map((f) => URL.createObjectURL(f));
    setNewImagePreviews((prev) => [...prev, ...previews]);
  };

  const handleRemoveNewImage = (idx: number) => {
    setNewImageFiles((prev) => prev.filter((_, i) => i !== idx));
    setNewImagePreviews((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleDeleteExistingImage = async (imageId: number) => {
    if (!window.confirm('Are you sure you want to delete this product image?')) return;
    try {
      await productManagementApi.deleteProductImage(imageId);
      const updated = existingImages.filter((img) => img.imageId !== imageId);
      setExistingImages(updated);
      setSuccessMessage('Image deleted successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to delete image');
      setTimeout(() => setErrorMessage(''), 4000);
    }
  };

  const handleSetPrimaryImage = async (imageId: number) => {
    try {
      await productManagementApi.setPrimaryProductImage(imageId);
      setExistingImages((prev) =>
        prev.map((img) => ({
          ...img,
          isPrimary: img.imageId === imageId,
        }))
      );
      setSuccessMessage('Primary image updated!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to set primary image');
      setTimeout(() => setErrorMessage(''), 4000);
    }
  };

  const handleOpenReplace = (imageId: number, isPrimary: boolean) => {
    setReplacingTarget({ imageId, isPrimary });
    replaceInputRef.current?.click();
  };

  const handleReplaceFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !replacingTarget) return;

    const { imageId, isPrimary } = replacingTarget;
    try {
      const newImg = await productManagementApi.uploadProductImage(productId, file, isPrimary);
      try {
        await productManagementApi.deleteProductImage(imageId);
      } catch (delErr) {
        console.warn('Old image deletion warning during replace:', delErr);
      }
      setExistingImages((prev) =>
        prev.map((img) => (img.imageId === imageId ? newImg : (isPrimary ? { ...img, isPrimary: false } : img)))
      );
      setSuccessMessage('Image replaced successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to replace image');
      setTimeout(() => setErrorMessage(''), 4000);
    } finally {
      setReplacingTarget(null);
      if (replaceInputRef.current) replaceInputRef.current.value = '';
    }
  };

  // Category Modal Handlers
  const handleCategoryInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setCategoryFormData((prev) => ({
      ...prev,
      [name]: name === 'parentId' ? (value ? Number(value) : null) : value,
    }));
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryFormData.categoryName.trim()) {
      setCategoryModalError('Category name is required.');
      return;
    }

    try {
      setCatLoading(true);
      setCategoryModalError(null);
      const newCat = await categoryApi.createCategory({
        categoryName: categoryFormData.categoryName.trim(),
        description: categoryFormData.description?.trim() || '',
        parentId: categoryFormData.parentId,
      });

      const updatedCats = await productManagementApi.getCategories();
      setCategories(updatedCats);
      const updatedFullCats = await categoryApi.getAllCategories(0, 1000);
      if (updatedFullCats?.content) {
        setAllCategoriesFull(updatedFullCats.content);
      }

      setSelectedCategory(String(newCat.categoryId));
      setShowCategoryModal(false);
      setCategoryFormData({ categoryName: '', description: '', parentId: null });
      toast.success(`Category "${newCat.categoryName}" created!`);
    } catch (err: any) {
      setCategoryModalError(
        err.response?.data?.message || err.message || 'Failed to create category'
      );
    } finally {
      setCatLoading(false);
    }
  };

  const handleBrandModalSubmit = async (data: BrandRequest, file: File | null) => {
    try {
      setBrandLoading(true);
      const res = await createBrand(data, file);
      setBrands((prev) => [...prev, { brandId: res.brandId, brandName: res.brandName }]);
      setSelectedBrand(String(res.brandId));
      setShowBrandModal(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Failed to create brand');
    } finally {
      setBrandLoading(false);
    }
  };

  const handleQuickCreateTag = async (e?: React.SyntheticEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const clean = newTagName.replace(/^#/, '').trim();
    if (!clean) {
      toast.warning('Please enter a tag name');
      return;
    }

    const existing = allTags.find((t) => t.tagName.toLowerCase() === clean.toLowerCase());
    if (existing) {
      if (!selectedTagIds.includes(existing.tagId)) {
        setSelectedTagIds((prev) => [...prev, existing.tagId]);
        toast.info(`Tag "${existing.tagName}" already exists and has been selected!`);
      } else {
        toast.info(`Tag "${existing.tagName}" is already attached to this product.`);
      }
      setShowTagModal(false);
      setNewTagName('');
      return;
    }

    try {
      setTagLoading(true);
      const res = await tagApi.createTag({ tagName: clean });
      setAllTags((prev) => [...prev, { tagId: res.tagId, tagName: res.tagName }]);
      setSelectedTagIds((prev) => [...prev, res.tagId]);
      setShowTagModal(false);
      setNewTagName('');
      toast.success(`Tag "${res.tagName}" created successfully!`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to create tag');
    } finally {
      setTagLoading(false);
    }
  };

  // Submit Update
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!productName.trim() || productName.trim().length < 3) {
      setErrorMessage('Please enter a valid product name (at least 3 characters).');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (!selectedCategory) {
      setErrorMessage('Please select a category.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (isPerishable && !expiryDate) {
      setErrorMessage('Please provide an expiration date for perishable products.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setSubmitting(true);
    try {
      // 1. Update Base Product
      await productManagementApi.updateProduct(productId, {
        productName: productName.trim(),
        description: description.trim(),
        status: status,
        categoryId: Number(selectedCategory),
        brandId: selectedBrand ? Number(selectedBrand) : undefined,
        userId: 1,
        isPerishable: isPerishable,
      });

      // 2. Assign Tags
      if (selectedTagIds.length > 0) {
        try {
          await productManagementApi.assignProductTags(productId, selectedTagIds);
        } catch (tagErr) {
          console.warn('Tag update skipped:', tagErr);
        }
      }

      // 3. Upload New Product Images
      if (newImageFiles.length > 0) {
        for (let i = 0; i < newImageFiles.length; i++) {
          try {
            await productManagementApi.uploadProductImage(
              productId,
              newImageFiles[i],
              !existingImages.some((img) => img.isPrimary) && i === 0
            );
          } catch (imgErr) {
            console.warn('Image upload skipped:', imgErr);
          }
        }
      }

      // 4. Create Newly Generated Variants if enabled
      if (hasVariants && generatedVariants.length > 0) {
        let dbVariations: any[] = [];
        try {
          dbVariations = await variantApi.getVariations();
        } catch {
          dbVariations = [];
        }

        const activeAttrs = attributes.filter((a) => a.values && a.values.length > 0);
        const optionMap = new Map<string, number>();

        for (const attr of activeAttrs) {
          let dbVar = dbVariations.find(
            (v) => v.name?.toLowerCase() === attr.name.toLowerCase()
          );
          if (!dbVar) {
            try {
              dbVar = await variantApi.createVariation(attr.name);
              dbVariations.push(dbVar);
            } catch (err) {
              console.warn('Failed to create variation:', err);
            }
          }

          if (dbVar?.variationId) {
            let existingOpts: any[] = [];
            try {
              existingOpts = await variantApi.getOptionsByVariationId(dbVar.variationId);
            } catch {
              existingOpts = [];
            }

            for (const val of attr.values) {
              let dbOpt = existingOpts.find(
                (o) => o.value?.toLowerCase() === val.toLowerCase()
              );
              if (!dbOpt) {
                try {
                  dbOpt = await variantApi.createVariationOption(dbVar.variationId, val);
                  existingOpts.push(dbOpt);
                } catch (err) {
                  console.warn('Failed to create option:', err);
                }
              }
              if (dbOpt?.optionId) {
                optionMap.set(
                  `${attr.name.toLowerCase()}:::${val.toLowerCase()}`,
                  dbOpt.optionId
                );
              }
            }
          }
        }

        // Create each generated variant
        for (const gv of generatedVariants) {
          const validOptionIds = gv.combination
            .map((c) => optionMap.get(`${c.attrName.toLowerCase()}:::${c.value.toLowerCase()}`))
            .filter((id): id is number => typeof id === 'number');

          const varSellingPrice = Number(gv.price) || 0;
          const varCostPrice = gv.costPrice !== undefined && gv.costPrice !== '' ? Number(gv.costPrice) : undefined;
          const varStock = Number(gv.stock) || 0;

          try {
            const createdVariant = await productManagementApi.createProductVariantWithOptions({
              productId: productId,
              sku: gv.sku, // Auto-generated SKU
              sellingPrice: varSellingPrice,
              costPrice: varCostPrice,
              status: 'ACTIVE',
              optionIds: validOptionIds,
              initialStock: varStock,
            });

            if (gv.images && gv.images.length > 0 && createdVariant?.variantId) {
              for (const file of gv.images) {
                try {
                  await productManagementApi.uploadProductVariantImage(createdVariant.variantId, file);
                } catch (err) {
                  console.warn('Failed to upload variant image:', err);
                }
              }
            }
          } catch (err) {
            console.warn('Failed to create variant:', err);
          }
        }
      }

      setSuccessMessage('Product updated successfully!');
      setTimeout(() => {
        navigate('/admin/products');
      }, 1200);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update product');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>
        <FiPackage size={40} className="spin" style={{ marginBottom: '12px' }} />
        <p>Loading product details...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '24px' }}>
        <BackButton fallbackUrl="/admin/products" />
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className={styles.iconBadge} style={{ margin: 0 }}>
            <FiPackage />
          </div>
          <div>
            <h1 className={styles.mainTitle} style={{ textAlign: 'left', margin: 0 }}>Edit Product #{productId}</h1>
            <p className={styles.mainSubtitle} style={{ textAlign: 'left', margin: 0 }}>Update product specifications, category, brand, tags, and variations</p>
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className={styles.alertError} style={{ marginBottom: '20px' }}>
          <FiAlertCircle /> <span>{errorMessage}</span>
        </div>
      )}
      {successMessage && (
        <div className={styles.alertSuccess} style={{ marginBottom: '20px' }}>
          <FiCheck /> <span>{successMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 340px', gap: '24px', alignItems: 'start' }}>
          {/* Left Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Card 1: Basic Information */}
            <div className={styles.card} style={{ background: '#fff', borderRadius: '14px', padding: '24px', border: '1px solid #edf0f5' }}>
              <h2 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 16px 0', color: '#0f172a' }}>Basic Information</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Product Name <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    placeholder="e.g. Dell Inspiron 15"
                    className={styles.inputField}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Description
                  </label>
                  <textarea
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Enter detailed product description..."
                    className={styles.inputField}
                    style={{ resize: 'vertical' }}
                  />
                </div>
              </div>
            </div>

            {/* Card 2: Expiration & Perishable tracking */}
            <div className={styles.card} style={{ background: '#fff', borderRadius: '14px', padding: '24px', border: '1px solid #edf0f5' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FiClock color="#6366f1" size={18} />
                  <h2 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: '#0f172a' }}>Perishable &amp; Expiry Tracking</h2>
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: '#334155' }}>
                  <input
                    type="checkbox"
                    checked={isPerishable}
                    onChange={(e) => setIsPerishable(e.target.checked)}
                  />
                  <span>Product is perishable</span>
                </label>
              </div>

              {isPerishable && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginTop: '14px', padding: '16px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                      Expiry Date <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <DatePicker
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(e.target.value)}
                      placeholder="Select expiry date"
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                      Batch Number
                    </label>
                    <input
                      type="text"
                      value={batchNumber}
                      onChange={(e) => setBatchNumber(e.target.value)}
                      placeholder="e.g. BATCH-2026-001"
                      className={styles.inputField}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Card 3: Product Images */}
            <div className={styles.card} style={{ background: '#fff', borderRadius: '14px', padding: '24px', border: '1px solid #edf0f5' }}>
              <h2 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 16px 0', color: '#0f172a' }}>Add More Images</h2>
              
              <div
                style={{
                  border: '2px dashed #cbd5e1',
                  borderRadius: '12px',
                  padding: '32px 20px',
                  textAlign: 'center',
                  background: '#f8fafc',
                  cursor: 'pointer',
                  transition: 'border 0.2s',
                }}
                onClick={() => fileInputRef.current?.click()}
              >
                <FiUploadCloud size={32} color="#94a3b8" style={{ marginBottom: '8px' }} />
                <p style={{ margin: '0 0 4px 0', fontSize: '13px', fontWeight: 600, color: '#334155' }}>
                  Click to select files from device
                </p>
                <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8' }}>
                  Supports PNG, JPG, JPEG, WEBP
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleImageFileChange}
                />
              </div>

              <input
                ref={replaceInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleReplaceFileChange}
              />

              {newImagePreviews.length > 0 && (
                <div style={{ marginTop: '16px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '8px' }}>
                    New Images to Upload ({newImagePreviews.length})
                  </span>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    {newImagePreviews.map((url, idx) => (
                      <div key={idx} style={{ position: 'relative', width: '80px', height: '80px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                        <img src={url} alt="New upload preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <button
                          type="button"
                          onClick={() => handleRemoveNewImage(idx)}
                          style={{
                            position: 'absolute',
                            top: '4px',
                            right: '4px',
                            background: '#ef4444',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '50%',
                            width: '18px',
                            height: '18px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                          }}
                        >
                          <FiX size={10} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {existingImages.length > 0 && (
                <div style={{ marginTop: '20px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '8px' }}>
                    Current Photos ({existingImages.length})
                  </span>
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    {existingImages.map((img) => (
                      <div key={img.imageId} style={{ position: 'relative', width: '90px', height: '90px', borderRadius: '8px', overflow: 'hidden', border: img.isPrimary ? '2px solid #2563eb' : '1px solid #e2e8f0' }}>
                        <img src={getAssetUrl(img.imageUrl)} alt="Current photo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        
                        {img.isPrimary && (
                          <span style={{ position: 'absolute', bottom: '2px', left: '2px', background: '#2563eb', color: '#fff', fontSize: '9px', fontWeight: 700, padding: '2px 5px', borderRadius: '4px' }}>
                            Primary
                          </span>
                        )}

                        <div style={{ position: 'absolute', top: '3px', right: '3px', display: 'flex', gap: '3px' }}>
                          {!img.isPrimary && (
                            <button
                              type="button"
                              title="Set as Primary"
                              onClick={() => handleSetPrimaryImage(img.imageId)}
                              style={{ background: 'rgba(15,23,42,0.7)', color: '#fff', border: 'none', borderRadius: '4px', width: '20px', height: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                              <FiStar size={10} />
                            </button>
                          )}
                          <button
                            type="button"
                            title="Replace Photo"
                            onClick={() => handleOpenReplace(img.imageId, img.isPrimary)}
                            style={{ background: 'rgba(15,23,42,0.7)', color: '#fff', border: 'none', borderRadius: '4px', width: '20px', height: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          >
                            <FiRefreshCw size={10} />
                          </button>
                          <button
                            type="button"
                            title="Delete Photo"
                            onClick={() => handleDeleteExistingImage(img.imageId)}
                            style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: '4px', width: '20px', height: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          >
                            <FiX size={10} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Card 4: Existing Associated Variants (Listed cleanly, SKU is read-only) */}
            {existingVariants.length > 0 && (
              <div className={styles.card} style={{ background: '#fff', borderRadius: '14px', padding: '24px', border: '1px solid #edf0f5' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div>
                    <h2 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: '#0f172a' }}>
                      Associated Variants ({existingVariants.length})
                    </h2>
                    <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#64748b' }}>
                      Edit price, cost, status, and photos directly for each variant
                    </p>
                  </div>
                  <button
                    type="button"
                    className={styles.btnActionOutline}
                    onClick={() => navigate('/admin/variants')}
                  >
                    <FiSliders size={12} /> Manage in Variants Page
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {existingVariants.map((v) => (
                    <div
                      key={v.variantId}
                      style={{
                        border: '1px solid #e2e8f0',
                        borderRadius: '12px',
                        padding: '16px 18px',
                        background: '#f8fafc',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      {/* Card Header */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                          <span style={{
                            padding: '3px 10px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: 700,
                            background: v.status === 'ACTIVE' ? '#ecfdf5' : '#f1f5f9',
                            color: v.status === 'ACTIVE' ? '#059669' : '#64748b',
                            border: `1px solid ${v.status === 'ACTIVE' ? '#a7f3d0' : '#cbd5e1'}`
                          }}>
                            ● {v.status || 'ACTIVE'}
                          </span>

                          {/* Attribute Badges */}
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                            {v.attributeSummary ? (
                              v.attributeSummary.split('|').map((part: string, pIdx: number) => (
                                <span
                                  key={pIdx}
                                  style={{
                                    fontSize: '11px',
                                    fontWeight: 600,
                                    padding: '3px 8px',
                                    background: '#e0e7ff',
                                    color: '#4338ca',
                                    borderRadius: '6px',
                                    border: '1px solid #c7d2fe',
                                  }}
                                >
                                  {part.trim()}
                                </span>
                              ))
                            ) : (
                              <span style={{ fontSize: '11px', color: '#94a3b8' }}>Standard variant</span>
                            )}
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <button
                            type="button"
                            disabled={savingVariantId === v.variantId}
                            onClick={() => handleSaveExistingVariant(v)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                              background: '#2563eb',
                              color: '#fff',
                              border: 'none',
                              borderRadius: '7px',
                              padding: '5px 12px',
                              fontSize: '11px',
                              fontWeight: 600,
                              cursor: 'pointer',
                              boxShadow: '0 1px 2px rgba(37,99,235,0.2)',
                            }}
                          >
                            {savingVariantId === v.variantId ? (
                              <>
                                <FiRefreshCw size={11} className={styles.exportSpinner} /> Saving...
                              </>
                            ) : (
                              <>
                                <FiSave size={11} /> Save Variant
                              </>
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleToggleExistingVariantStatus(v.variantId, v.status)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              background: 'transparent',
                              color: v.status === 'ACTIVE' ? '#ef4444' : '#10b981',
                              border: `1px solid ${v.status === 'ACTIVE' ? '#fecaca' : '#a7f3d0'}`,
                              borderRadius: '7px',
                              padding: '5px 10px',
                              fontSize: '11px',
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                          >
                            {v.status === 'ACTIVE' ? <><FiX size={11} /> Deactivate</> : <><FiCheck size={11} /> Activate</>}
                          </button>
                        </div>
                      </div>

                      {/* Variant Inputs Row (SKU is Read-only) */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px', marginBottom: '12px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                            SKU (Auto-generated)
                          </label>
                          <input
                            type="text"
                            readOnly
                            disabled
                            value={v.sku || `#${v.variantId}`}
                            style={{
                              width: '100%',
                              padding: '6px 10px',
                              borderRadius: '6px',
                              border: '1px solid #e2e8f0',
                              fontSize: '12px',
                              fontWeight: 600,
                              color: '#64748b',
                              background: '#f1f5f9',
                              cursor: 'not-allowed',
                            }}
                          />
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                            Selling Price (MMK) *
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={v.sellingPrice ?? ''}
                            onChange={(e) => handleExistingVariantFieldChange(v.variantId, 'sellingPrice', e.target.value)}
                            style={{
                              width: '100%',
                              padding: '6px 10px',
                              borderRadius: '6px',
                              border: '1px solid #cbd5e1',
                              fontSize: '12px',
                              fontWeight: 600,
                              color: '#0f172a',
                              outline: 'none',
                            }}
                          />
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                            Cost Price (MMK)
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="any"
                            placeholder="Optional"
                            value={v.costPrice ?? ''}
                            onChange={(e) => handleExistingVariantFieldChange(v.variantId, 'costPrice', e.target.value)}
                            style={{
                              width: '100%',
                              padding: '6px 10px',
                              borderRadius: '6px',
                              border: '1px solid #cbd5e1',
                              fontSize: '12px',
                              color: '#334155',
                              outline: 'none',
                            }}
                          />
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                            Status
                          </label>
                          <select
                            value={v.status || 'ACTIVE'}
                            onChange={(e) => handleExistingVariantFieldChange(v.variantId, 'status', e.target.value)}
                            style={{
                              width: '100%',
                              padding: '6px 10px',
                              borderRadius: '6px',
                              border: '1px solid #cbd5e1',
                              fontSize: '12px',
                              fontWeight: 600,
                              color: '#334155',
                              background: '#fff',
                              outline: 'none',
                            }}
                          >
                            <option value="ACTIVE">ACTIVE</option>
                            <option value="INACTIVE">INACTIVE</option>
                          </select>
                        </div>
                      </div>

                      {/* Variant Photos */}
                      <div>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '6px' }}>
                          Variant Photos ({v.images ? v.images.length : 0})
                        </span>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                          {v.images && v.images.length > 0 && (
                            v.images.map((img: any) => (
                              <div
                                key={img.productVariantImageId}
                                style={{
                                  position: 'relative',
                                  width: '48px',
                                  height: '48px',
                                  borderRadius: '6px',
                                  overflow: 'hidden',
                                  border: '1px solid #cbd5e1',
                                }}
                              >
                                <img
                                  src={getAssetUrl(img.imageUrl)}
                                  alt="Variant"
                                  style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                    display: 'block',
                                  }}
                                />
                                <button
                                  type="button"
                                  onClick={() => handleDeleteExistingVariantPhoto(v.variantId, img.productVariantImageId)}
                                  title="Delete photo"
                                  style={{
                                    position: 'absolute',
                                    top: '2px',
                                    right: '2px',
                                    width: '16px',
                                    height: '16px',
                                    borderRadius: '50%',
                                    background: '#ef4444',
                                    color: '#fff',
                                    border: 'none',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '9px',
                                    cursor: 'pointer',
                                    padding: 0,
                                  }}
                                >
                                  ✕
                                </button>
                              </div>
                            ))
                          )}

                          <button
                            type="button"
                            onClick={() => document.getElementById(`existing-var-photo-${v.variantId}`)?.click()}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '5px 10px',
                              borderRadius: '6px',
                              border: '1px dashed #6366f1',
                              color: '#6366f1',
                              fontSize: '11px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              background: '#ffffff',
                            }}
                          >
                            <FiPlus size={11} /> Add Photo
                          </button>
                          <input
                            id={`existing-var-photo-${v.variantId}`}
                            type="file"
                            accept="image/*"
                            style={{ display: 'none' }}
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                handleUploadExistingVariantPhoto(v.variantId, e.target.files[0]);
                                e.target.value = '';
                              }
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Card 5: Product Variations Builder (Starts UNCHECKED and EMPTY on load) */}
            <div className={styles.sectionCard}>
              <h3 className={styles.sectionTitle}>
                <FiSliders color="#2563eb" /> Product Variations
              </h3>

              <div style={{ marginBottom: '14px' }}>
                <label className={styles.checkboxLabel} style={{ margin: 0 }}>
                  <input
                    type="checkbox"
                    checked={hasVariants}
                    onChange={(e) => handleToggleHasVariants(e.target.checked)}
                  />
                  <span style={{ fontWeight: 600, color: hasVariants ? '#2563eb' : '#334155' }}>
                    This product has variants (size, color, etc.)
                  </span>
                </label>
              </div>

              {!hasVariants ? (
                <div style={{ marginTop: '6px', padding: '12px 14px', background: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
                  <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>
                    💡 Click &quot;This product has variants&quot; above to select attributes and generate new variant cards.
                  </p>
                </div>
              ) : (
                <div className={styles.variationsSubSection}>
                  {/* STEP 1: ADD EXISTING ATTRIBUTE */}
                  <div className={styles.addExistingAttributeBox}>
                    <label className={styles.addExistingAttrLabel}>
                      ADD EXISTING ATTRIBUTE
                    </label>
                    <div className={styles.addExistingAttrControls}>
                      <select
                        className={styles.addExistingAttrSelect}
                        value={selectedExistingAttr}
                        onChange={(e) => setSelectedExistingAttr(e.target.value)}
                      >
                        <option value="">Select attribute</option>
                        {availableAttributes
                          .filter(
                            (a) =>
                              !attributes.some(
                                (cur) => cur.name.toLowerCase() === a.toLowerCase()
                              )
                          )
                          .map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                      </select>
                      <button
                        type="button"
                        className={styles.btnAddAttrBtn}
                        onClick={handleAddExistingAttribute}
                      >
                        Add
                      </button>
                      <button
                        type="button"
                        className={styles.btnNewAttrSmall}
                        style={{ padding: '8px 12px' }}
                        onClick={() => setShowAddAttrInput(true)}
                      >
                        <FiPlus size={12} /> Custom
                      </button>
                    </div>
                  </div>

                  {/* Inline input for custom new attribute */}
                  {showAddAttrInput && (
                    <div
                      style={{
                        background: '#eff6ff',
                        border: '1px solid #bfdbfe',
                        padding: '12px',
                        borderRadius: '10px',
                        marginBottom: '16px',
                        display: 'flex',
                        gap: '8px',
                        alignItems: 'center',
                      }}
                    >
                      <input
                        type="text"
                        placeholder="Enter attribute name (e.g. Material)..."
                        value={customAttrName}
                        onChange={(e) => setCustomAttrName(e.target.value)}
                        className={styles.inputField}
                        style={{ flex: 1 }}
                      />
                      <button
                        type="button"
                        className={styles.btnNewAttrSmall}
                        onClick={handleAddCustomAttribute}
                      >
                        <FiCheck /> Add
                      </button>
                      <button
                        type="button"
                        className={styles.btnIconAction}
                        onClick={() => {
                          setShowAddAttrInput(false);
                          setCustomAttrName('');
                        }}
                      >
                        <FiX />
                      </button>
                    </div>
                  )}

                  {/* STEP 2: ACTIVE ATTRIBUTES & VALUES */}
                  {attributes.length > 0 && (
                    <div style={{ marginTop: '16px' }}>
                      <div className={styles.attrSectionHeader}>
                        <h4>Active Attributes &amp; Values</h4>
                      </div>

                      {attributes.map((attr) => {
                        const isColor =
                          attr.name.toLowerCase().includes('colour') ||
                          attr.name.toLowerCase().includes('color');

                        const attrLower = attr.name.toLowerCase();
                        const presets =
                          ATTRIBUTE_PRESETS[attrLower] ||
                          (attrLower.includes('color') || attrLower.includes('colour')
                            ? ATTRIBUTE_PRESETS.color
                            : attrLower.includes('size')
                            ? ATTRIBUTE_PRESETS.size
                            : null);

                        return (
                          <div key={attr.id} className={styles.attributeItemCard}>
                            <div className={styles.attrItemTitleRow}>
                              <span className={styles.attrNameTitle}>{attr.name}</span>
                              <button
                                type="button"
                                className={styles.btnIconAction}
                                onClick={() => handleRemoveAttribute(attr.id)}
                                title={`Delete ${attr.name}`}
                              >
                                <FiTrash2 />
                              </button>
                            </div>

                            {/* Quick Suggestions presets if available */}
                            {presets && (
                              <div style={{ marginBottom: '10px' }}>
                                <span
                                  style={{
                                    fontSize: '11px',
                                    color: '#64748b',
                                    fontWeight: 600,
                                    display: 'block',
                                    marginBottom: '6px',
                                  }}
                                >
                                  Quick Suggestions (click to add):
                                </span>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                  {presets.map((presetVal) => {
                                    const isAdded = attr.values.some(
                                      (v) => v.toLowerCase() === presetVal.toLowerCase()
                                    );
                                    if (isAdded) return null;
                                    return (
                                      <button
                                        key={presetVal}
                                        type="button"
                                        onClick={() => handleAddPresetValue(attr.id, presetVal)}
                                        style={{
                                          background: '#ffffff',
                                          border: '1px solid #cbd5e1',
                                          borderRadius: '16px',
                                          padding: '3px 10px',
                                          fontSize: '12px',
                                          cursor: 'pointer',
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: '5px',
                                          color: '#334155',
                                        }}
                                      >
                                        {isColor && (
                                          <span
                                            style={{
                                              width: '10px',
                                              height: '10px',
                                              borderRadius: '50%',
                                              backgroundColor: getColorHex(presetVal),
                                              border: '1px solid rgba(0,0,0,0.15)',
                                              display: 'inline-block',
                                            }}
                                          />
                                        )}
                                        <span>+ {presetVal}</span>
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {/* Swatches / Selected Values Box */}
                            <div style={{ marginBottom: '8px' }}>
                              <p style={{ margin: '0 0 8px 0', fontSize: '11px', color: '#64748b' }}>
                                💡 Click any pill below to remove it. Type in the input and click (+) to add new values.
                              </p>
                              <div className={styles.swatchesBox}>
                                {isColor
                                  ? attr.values.map((val) => (
                                      <span
                                        key={val}
                                        style={{
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: '6px',
                                          padding: '4px 10px',
                                          borderRadius: '16px',
                                          border: '1px solid #e2e8f0',
                                          background: '#f8fafc',
                                          cursor: 'pointer',
                                          fontSize: '12px',
                                          color: '#334155',
                                          transition: 'all 0.15s ease',
                                        }}
                                        title={`${val} (Click to remove)`}
                                        onClick={() => handleRemoveValue(attr.id, val)}
                                      >
                                        <span
                                          style={{
                                            width: '12px',
                                            height: '12px',
                                            borderRadius: '50%',
                                            backgroundColor: getColorHex(val),
                                            border: '1px solid rgba(0,0,0,0.15)',
                                            display: 'inline-block',
                                          }}
                                        />
                                        <span>{val}</span>
                                        <FiX size={10} color="#94a3b8" />
                                      </span>
                                    ))
                                  : attr.values.map((val) => (
                                      <span
                                        key={val}
                                        className={styles.valuePill}
                                        onClick={() => handleRemoveValue(attr.id, val)}
                                        title={`${val} (Click to remove)`}
                                      >
                                        {val} <FiX size={10} color="#94a3b8" />
                                      </span>
                                    ))}
                                {attr.values.length === 0 && (
                                  <span style={{ fontSize: '12px', color: '#94a3b8', fontStyle: 'italic' }}>
                                    No values added yet. Select a suggestion above or enter a value below.
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Inline Add Value Input */}
                            <div className={styles.inlineAddValueRow}>
                              <input
                                type="text"
                                placeholder={`Add new ${attr.name.toLowerCase()} value`}
                                value={inlineValues[attr.id] || ''}
                                onChange={(e) =>
                                  setInlineValues((prev) => ({
                                    ...prev,
                                    [attr.id]: e.target.value,
                                  }))
                                }
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleAddValueToAttr(attr.id);
                                  }
                                }}
                              />
                              <button
                                type="button"
                                className={styles.btnAddValuePlus}
                                onClick={() => handleAddValueToAttr(attr.id)}
                                title="Add value"
                              >
                                <FiPlus />
                              </button>
                            </div>
                          </div>
                        );
                      })}

                      
                    </div>
                  )}

                  {/* STEP 3: GENERATED VARIANTS CARDS */}
                  {generatedVariants.length > 0 && (
                    <div className={styles.generatedVariantsSection} style={{ marginTop: '24px' }}>
                      <div className={styles.generatedVariantsHeader}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <h4 className={styles.generatedVariantsTitle}>
                            New Generated Variants
                          </h4>
                          <span className={styles.variantsCountBadge}>
                            {generatedVariants.length} new variant(s)
                          </span>
                        </div>

                        
                      </div>

                      <div className={styles.variantsCardGrid}>
                        {generatedVariants.map((gv, idx) => (
                          <div key={gv.id} className={styles.singleVariantCard}>
                            {/* Top row: Title + SKU + Trash Button */}
                            <div className={styles.variantCardTopRow}>
                              <div className={styles.variantCardTitleCol}>
                                <span className={styles.variantCardTitle}>
                                  New Variant {idx + 1}
                                </span>
                                <span className={styles.variantCardSku}>
                                  {gv.sku}
                                </span>
                              </div>
                              <button
                                type="button"
                                className={styles.btnDeleteVariantCard}
                                onClick={() => handleDeleteGeneratedVariant(gv.id)}
                                title="Remove this new variant"
                              >
                                <FiTrash2 size={13} />
                              </button>
                            </div>

                            {/* Attribute Badges */}
                            <div className={styles.variantAttrsPillsRow}>
                              {gv.combination.map((c, cIdx) => {
                                const isColor =
                                  c.attrName.toLowerCase().includes('color') ||
                                  c.attrName.toLowerCase().includes('colour');
                                return (
                                  <div key={cIdx} className={styles.variantAttrPill}>
                                    {isColor && (
                                      <span
                                        className={styles.variantColorDot}
                                        style={{
                                          backgroundColor: getColorHex(c.value),
                                        }}
                                      />
                                    )}
                                    <span>
                                      {isColor ? 'Color' : `${c.attrName}: ${c.value}`}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>

                            {/* Price & Stock Inputs */}
                            <div className={styles.variantCardInputsRow}>
                              <div className={styles.variantCardInputCol}>
                                <label>Selling Price (MMK) *</label>
                                <input
                                  type="number"
                                  min="0"
                                  value={gv.price}
                                  placeholder="0"
                                  onChange={(e) =>
                                    handleVariantFieldChange(gv.id, 'price', e.target.value)
                                  }
                                />
                              </div>
                              <div className={styles.variantCardInputCol}>
                                <label>Cost Price (MMK)</label>
                                <input
                                  type="number"
                                  min="0"
                                  placeholder="0"
                                  value={gv.costPrice !== undefined ? gv.costPrice : ''}
                                  onChange={(e) =>
                                    handleVariantFieldChange(gv.id, 'costPrice', e.target.value)
                                  }
                                />
                              </div>
                              <div className={styles.variantCardInputCol}>
                                <label>Stock</label>
                                <input
                                  type="number"
                                  min="0"
                                  placeholder="0"
                                  value={gv.stock}
                                  onChange={(e) =>
                                    handleVariantFieldChange(gv.id, 'stock', e.target.value)
                                  }
                                />
                              </div>
                            </div>

                            {/* Add Images Button & Previews */}
                            <div>
                              <input
                                type="file"
                                multiple
                                accept="image/*"
                                id={`var-file-${gv.id}`}
                                style={{ display: 'none' }}
                                onChange={(e) =>
                                  handleVariantImagesUpload(gv.id, e.target.files)
                                }
                              />
                              <button
                                type="button"
                                className={styles.btnAddVariantImagesBtn}
                                onClick={() =>
                                  document.getElementById(`var-file-${gv.id}`)?.click()
                                }
                              >
                                Add Images
                              </button>

                              {gv.imagePreviews && gv.imagePreviews.length > 0 && (
                                <div
                                  style={{
                                    display: 'flex',
                                    gap: '8px',
                                    marginTop: '10px',
                                    flexWrap: 'wrap',
                                  }}
                                >
                                  {gv.imagePreviews.map((url, imgIdx) => (
                                    <div
                                      key={imgIdx}
                                      style={{
                                        position: 'relative',
                                        display: 'inline-block',
                                      }}
                                    >
                                      <img
                                        src={url}
                                        alt={`Variant ${idx + 1} Preview ${imgIdx + 1}`}
                                        style={{
                                          width: '60px',
                                          height: '60px',
                                          objectFit: 'cover',
                                          borderRadius: '6px',
                                          border: '1px solid #e2e8f0',
                                        }}
                                      />
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveVariantImage(gv.id, imgIdx)}
                                        style={{
                                          position: 'absolute',
                                          top: '-6px',
                                          right: '-6px',
                                          background: '#ef4444',
                                          color: 'white',
                                          border: 'none',
                                          borderRadius: '50%',
                                          width: '18px',
                                          height: '18px',
                                          cursor: 'pointer',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          padding: 0,
                                        }}
                                      >
                                        <FiX size={10} />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Taxonomy & Action Controls */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Status Card */}
            <div className={styles.card} style={{ background: '#fff', borderRadius: '14px', padding: '20px', border: '1px solid #edf0f5' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>
                Product Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#334155',
                  background: '#fff',
                  outline: 'none',
                }}
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
              </select>
            </div>

            {/* Category & Brand Card */}
            <div className={styles.card} style={{ background: '#fff', borderRadius: '14px', padding: '20px', border: '1px solid #edf0f5' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 16px 0', color: '#0f172a' }}>Organization</h3>

              {/* Category */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>
                    Category <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowCategoryModal(true)}
                    style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: '11px', fontWeight: 600, cursor: 'pointer', padding: 0 }}
                  >
                    + New
                  </button>
                </div>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className={styles.inputField}
                  required
                >
                  <option value="">Select category</option>
                  {categories.map((c) => (
                    <option key={c.categoryId} value={c.categoryId}>
                      {c.categoryName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Brand */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>
                    Brand
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowBrandModal(true)}
                    style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: '11px', fontWeight: 600, cursor: 'pointer', padding: 0 }}
                  >
                    + New
                  </button>
                </div>
                <select
                  value={selectedBrand}
                  onChange={(e) => setSelectedBrand(e.target.value)}
                  className={styles.inputField}
                >
                  <option value="">Select brand</option>
                  {brands.map((b) => (
                    <option key={b.brandId} value={b.brandId}>
                      {b.brandName}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Tags Card */}
            <div className={styles.card} style={{ background: '#fff', borderRadius: '14px', padding: '20px', border: '1px solid #edf0f5' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 700, margin: 0, color: '#0f172a' }}>Tags</h3>
                <button
                  type="button"
                  onClick={() => setShowTagModal(true)}
                  style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: '11px', fontWeight: 600, cursor: 'pointer', padding: 0 }}
                >
                  + New Tag
                </button>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {allTags.map((tag) => {
                  const isSelected = selectedTagIds.includes(tag.tagId);
                  return (
                    <button
                      key={tag.tagId}
                      type="button"
                      onClick={() =>
                        setSelectedTagIds((prev) =>
                          isSelected ? prev.filter((id) => id !== tag.tagId) : [...prev, tag.tagId]
                        )
                      }
                      style={{
                        padding: '4px 10px',
                        borderRadius: '16px',
                        fontSize: '11px',
                        fontWeight: 600,
                        border: isSelected ? '1px solid #2563eb' : '1px solid #cbd5e1',
                        background: isSelected ? '#eff6ff' : '#fff',
                        color: isSelected ? '#2563eb' : '#64748b',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <FiTag size={10} />
                      <span>{tag.tagName}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Action Buttons */}
            <div className={styles.card} style={{ background: '#fff', borderRadius: '14px', padding: '20px', border: '1px solid #edf0f5' }}>
              <button
                type="submit"
                disabled={submitting}
                className={styles.btnCreateProduct}
                style={{ width: '100%', marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                {submitting ? (
                  <>
                    <FiRefreshCw className="spin" size={16} /> Saving Changes...
                  </>
                ) : (
                  <>
                    <FiSave size={16} /> Save Product Changes
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => navigate('/admin/products')}
                className={styles.btnActionOutline}
                style={{ width: '100%' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* Quick Category Form Modal */}
      <CategoryFormModal
        isOpen={showCategoryModal}
        formData={categoryFormData}
        editingId={null}
        saving={catLoading}
        errorMessage={categoryModalError}
        availableParents={allCategoriesFull}
        onInputChange={handleCategoryInputChange}
        onSubmit={handleCategorySubmit}
        onClose={() => {
          setShowCategoryModal(false);
          setCategoryModalError(null);
        }}
      />

      {/* Quick Brand Modal */}
      <BrandModal
        show={showBrandModal}
        brand={null}
        loading={brandLoading}
        categories={categories.map((c) => ({
          categoryId: c.categoryId,
          categoryName: c.categoryName,
        }))}
        onClose={() => setShowBrandModal(false)}
        onSubmit={handleBrandModalSubmit}
      />

      {/* Quick Tag Modal */}
      {showTagModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', padding: '24px', borderRadius: '14px', width: '360px', maxWidth: '90%' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '15px', fontWeight: 700 }}>Add New Tag</h3>
            <input
              type="text"
              placeholder="Tag name (e.g. Best Seller)..."
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              className={styles.inputField}
              style={{ width: '100%', marginBottom: '16px' }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                type="button"
                onClick={() => {
                  setShowTagModal(false);
                  setNewTagName('');
                }}
                className={styles.btnActionOutline}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleQuickCreateTag}
                disabled={tagLoading}
                className={styles.btnAddProductPurple}
              >
                {tagLoading ? 'Creating...' : 'Create Tag'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditProductPage;
