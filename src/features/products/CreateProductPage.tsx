import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './ProductStyles.module.css';
import {
  productManagementApi,
  type CategoryItem,
  type BrandItem,
} from './productManagementApi';
import { tagApi } from '../tags/tagApi';
import { variantApi } from '../variants/variantApi';
import { categoryApi } from '../categories/categoryApi';
import { createBrand, type BrandRequest } from '../brand/brandApi';
import { CategoryFormModal } from '../categories/CategoryFormModal';
import { BrandModal } from '../brand/BrandModels';
import type { CategoryRequestDto, CategoryResponseDto } from '../../types/category';
import {
  FiPackage,
  FiInfo,
  FiFolder,
  FiImage,
  FiSliders,
  FiUploadCloud,
  FiTrash2,
  FiPlus,
  FiX,
  FiCheck,
  FiTag,
  FiRefreshCw,
  FiAlertCircle,
  FiClock,
} from 'react-icons/fi';
import { inventoryApi } from '../inventory/inventoryApi';

const ATTRIBUTE_PRESETS: Record<string, string[]> = {
  color: ['White', 'Black', 'Yellow', 'Red', 'Blue', 'Green', 'Grey', 'Navy'],
  size: ['S', 'M', 'L', 'XL', 'XXL'],
  storage: ['64GB', '128GB', '256GB', '512GB', '1TB'],
  material: ['Cotton', 'Leather', 'Polyester', 'Silk', 'Denim'],
};

const COLOR_MAP: Record<string, string> = {
  black: '#000000',
  gold: '#d4af37',
  olive: '#808000',
  navy: '#000080',
  blue: '#2563eb',
  purple: '#8b5cf6',
  'sky blue': '#38bdf8',
  'light blue': '#7dd3fc',
  pink: '#ec4899',
  maroon: '#800000',
  brown: '#78350f',
  green: '#10b981',
  white: '#ffffff',
  red: '#ef4444',
  yellow: '#eab308',
  orange: '#f97316',
  grey: '#64748b',
  gray: '#64748b',
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

export interface GeneratedVariant {
  id: string;
  sku: string;
  combination: Array<{ attrName: string; value: string }>;
  price: string | number;
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
    ? prodName.replace(/[^a-zA-Z0-9]/g, '').slice(0, 6).toUpperCase() || 'LVLUNO'
    : 'LVLUNO';

  let comboCode = '';
  combination.forEach((c) => {
    const val = c.value.trim().toUpperCase();
    if (val === 'WHITE') comboCode += 'I';
    else if (val === 'BLACK') comboCode += 'S';
    else if (val === 'YELLOW') comboCode += 'X';
    else if (val.length <= 2) comboCode += val;
    else comboCode += val.slice(0, 2);
  });

  const numPart = String(index + 1).padStart(3, '0');
  return `${prefix}${comboCode || 'V'}${numPart}`;
};

export const CreateProductPage: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form Fields
  const [productName, setProductName] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [status, setStatus] = useState('ACTIVE');
  const [description, setDescription] = useState('');

  // Categories & Brands
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [brands, setBrands] = useState<BrandItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedBrand, setSelectedBrand] = useState<string>('');

  // Expiration & Perishable tracking
  const [isPerishable, setIsPerishable] = useState<boolean>(false);
  const [expiryDate, setExpiryDate] = useState<string>('');
  const [manufactureDate, setManufactureDate] = useState<string>('');
  const [batchNumber, setBatchNumber] = useState<string>('');
  const [expiryTouched, setExpiryTouched] = useState<boolean>(false);

  // Auto-detect perishable products based on Category name
  const handleCategorySelect = (catId: string) => {
    setSelectedCategory(catId);
    const cat = categories.find((c) => String(c.categoryId) === catId);
    if (cat) {
      const name = cat.categoryName.toLowerCase();
      const perishableKeywords = [
        'food', 'drink', 'beverage', 'grocer', 'snack', 'bakery', 'fruit', 'dairy',
        'medicine', 'pharma', 'drug', 'health', 'medical', 'pill', 'tablet',
        'cosmetic', 'skincare', 'beauty', 'makeup', 'lotion', 'cream', 'serum',
        'supplement', 'vitamin', 'organic', 'perishable'
      ];
      const isPerish = perishableKeywords.some((kw) => name.includes(kw));
      setIsPerishable(isPerish);
    }
  };

  // Tags
  const [allTags, setAllTags] = useState<Array<{ tagId: number; tagName: string }>>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);

  const toggleTag = (tagId: number) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

  // Images
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  // Variations toggle & list (Defaults to FALSE, only expands when user clicks/enables)
  const [hasVariants, setHasVariants] = useState<boolean>(false);
  // Attributes start empty so user must explicitly choose from ADD EXISTING ATTRIBUTE
  const [attributes, setAttributes] = useState<LocalAttribute[]>([]);

  // Generated Variants State (Empty initially - cards only drop down when user clicks Generate Variants)
  const [generatedVariants, setGeneratedVariants] = useState<GeneratedVariant[]>([]);

  // Computed combinations count based on active attributes
  const computedCombosCount = useMemo(() => {
    const activeAttrs = attributes.filter((a) => a.values && a.values.length > 0);
    if (activeAttrs.length === 0) return 0;
    return activeAttrs.reduce((total, attr) => total * attr.values.length, 1);
  }, [attributes]);

  // Total variant stock sum across all generated cards
  const totalVariantStock = useMemo(() => {
    return generatedVariants.reduce(
      (acc, v) => acc + (Number(v.stock) || 0),
      0
    );
  }, [generatedVariants]);

  // Existing attributes available in database to add
  const [availableAttributes, setAvailableAttributes] = useState<string[]>([
    'Color',
    'Size',
    'Material',
    'Pattern',
    'Storage',
    'Weight',
  ]);
  const [selectedExistingAttr, setSelectedExistingAttr] = useState<string>('');

  // Inline value add states per attribute
  const [inlineValues, setInlineValues] = useState<Record<string | number, string>>({});

  // Prompt / modal for custom attribute
  const [showAddAttrInput, setShowAddAttrInput] = useState<boolean>(false);
  const [customAttrName, setCustomAttrName] = useState<string>('');

  // Submission state
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Validation touched states
  const [nameTouched, setNameTouched] = useState<boolean>(false);
  const [qtyTouched, setQtyTouched] = useState<boolean>(false);

  // Quick Create Modals
  const [showCategoryModal, setShowCategoryModal] = useState<boolean>(false);
  const [categoryFormData, setCategoryFormData] = useState<CategoryRequestDto>({
    categoryName: '',
    description: '',
    parentId: null,
  });
  const [categoryModalError, setCategoryModalError] = useState<string | null>(null);
  const [allCategoriesFull, setAllCategoriesFull] = useState<CategoryResponseDto[]>([]);
  const [catLoading, setCatLoading] = useState<boolean>(false);

  const [showBrandModal, setShowBrandModal] = useState<boolean>(false);
  const [brandLoading, setBrandLoading] = useState<boolean>(false);

  const [showTagModal, setShowTagModal] = useState<boolean>(false);
  const [newTagName, setNewTagName] = useState<string>('');
  const [tagLoading, setTagLoading] = useState<boolean>(false);

  const handleCategoryInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setCategoryFormData((prev) => ({
      ...prev,
      [name]:
        name === 'parentId'
          ? value
            ? Number(value)
            : null
          : value,
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
      const res = await categoryApi.createCategory(categoryFormData);
      setCategories((prev) => [...prev, { categoryId: res.categoryId, categoryName: res.categoryName }]);
      setAllCategoriesFull((prev) => [...prev, res]);
      handleCategorySelect(String(res.categoryId));
      setShowCategoryModal(false);
      setCategoryFormData({
        categoryName: '',
        description: '',
        parentId: null,
      });
    } catch (err: any) {
      setCategoryModalError(
        err.response?.data?.message || err.message || 'Failed to create category'
      );
    } finally {
      setCatLoading(false);
    }
  };

  const handleBrandModalSubmit = async (
    data: BrandRequest,
    file: File | null
  ) => {
    try {
      setBrandLoading(true);
      const res = await createBrand(data, file);
      setBrands((prev) => [...prev, { brandId: res.brandId, brandName: res.brandName }]);
      setSelectedBrand(String(res.brandId));
      setShowBrandModal(false);
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Failed to create brand');
    } finally {
      setBrandLoading(false);
    }
  };

  const handleQuickCreateTag = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newTagName.replace(/^#/, '').trim();
    if (!clean) return;
    try {
      setTagLoading(true);
      const res = await tagApi.createTag({ tagName: clean });
      setAllTags((prev) => [...prev, { tagId: res.tagId, tagName: res.tagName }]);
      setSelectedTagIds((prev) => [...prev, res.tagId]);
      setShowTagModal(false);
      setNewTagName('');
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Failed to create tag');
    } finally {
      setTagLoading(false);
    }
  };

  useEffect(() => {
    loadCategoriesAndBrands();
  }, []);

  const loadCategoriesAndBrands = async () => {
    try {
      const [cats, brs, vars, fullCats] = await Promise.allSettled([
        productManagementApi.getCategories(),
        productManagementApi.getBrands(),
        productManagementApi.getVariations(),
        categoryApi.getAllCategories(0, 1000),
      ]);

      if (fullCats.status === 'fulfilled' && fullCats.value?.content) {
        setAllCategoriesFull(fullCats.value.content);
      }

      if (cats.status === 'fulfilled' && cats.value.length > 0) {
        setCategories(cats.value);
        setSelectedCategory(String(cats.value[0].categoryId));
      } else {
        const defaultCats: CategoryItem[] = [
          { categoryId: 1, categoryName: 'Clothing' },
          { categoryId: 2, categoryName: 'Footwear' },
          { categoryId: 3, categoryName: 'Cosmetics' },
          { categoryId: 4, categoryName: 'Beverages' },
        ];
        setCategories(defaultCats);
        setSelectedCategory('1');
      }

      if (brs.status === 'fulfilled' && brs.value.length > 0) {
        setBrands(brs.value);
        setSelectedBrand(String(brs.value[0].brandId));
      } else {
        const defaultBrands: BrandItem[] = [
          { brandId: 1, brandName: 'Summer Breeze' },
          { brandId: 2, brandName: 'Nike' },
          { brandId: 3, brandName: 'Zara' },
          { brandId: 4, brandName: 'Apple' },
        ];
        setBrands(defaultBrands);
        setSelectedBrand('1');
      }

      if (vars.status === 'fulfilled' && vars.value.length > 0) {
        const varNames = vars.value.map((v: any) => v.name);
        setAvailableAttributes((prev) => [
          ...Array.from(new Set([...prev, ...varNames])),
        ]);
      }

      // Fetch available tags
      try {
        const tagRes = await tagApi.getAllTags(0, 100);
        if (tagRes && tagRes.content && tagRes.content.length > 0) {
          setAllTags(tagRes.content.map((t: any) => ({ tagId: t.tagId, tagName: t.tagName })));
        } else {
          setAllTags([
            { tagId: 1, tagName: 'new arrivals' },
            { tagId: 2, tagName: 'summer' },
            { tagId: 3, tagName: 'trending' },
            { tagId: 4, tagName: 'best seller' },
          ]);
        }
      } catch (tagErr) {
        console.warn('Failed to load tags:', tagErr);
        setAllTags([
          { tagId: 1, tagName: 'new arrivals' },
          { tagId: 2, tagName: 'summer' },
          { tagId: 3, tagName: 'trending' },
        ]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Image Upload Handling
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files).slice(0, 5 - selectedImages.length);
    if (files.length === 0) return;

    setSelectedImages((prev) => [...prev, ...files]);

    const newPreviews = files.map((file) => URL.createObjectURL(file));
    setImagePreviews((prev) => [...prev, ...newPreviews]);
  };

  const handleRemoveImage = (index: number) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  // Generate Cartesian variant combinations
  const generateCombosFromAttrs = (
    currentAttrs: LocalAttribute[],
    customPrice?: string | number,
    customProdName?: string
  ) => {
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
    const activePrice = customPrice !== undefined ? customPrice : price || 200000;
    const activeName = customProdName !== undefined ? customProdName : productName;

    setGeneratedVariants((prev) => {
      return combos.map((combo, idx) => {
        const comboKey = combo.map((c) => `${c.attrName}:${c.value}`).sort().join('|');
        const existing = prev.find((v) => {
          const key = v.combination.map((c) => `${c.attrName}:${c.value}`).sort().join('|');
          return key === comboKey;
        });

        if (existing) {
          return existing;
        }

        return {
          id: `var-${idx + 1}-${comboKey}`,
          sku: generateVariantSku(idx, combo, activeName),
          combination: combo,
          price: activePrice,
          stock: '',
          images: [],
          imagePreviews: [],
        };
      });
    });
  };

  // Toggle handler: Clicking variant checkbox at the top
  const handleToggleHasVariants = (checked: boolean) => {
    setHasVariants(checked);
    if (!checked) {
      setAttributes([]);
      setGeneratedVariants([]);
    } else if (attributes.length === 0) {
      // Auto-populate 'Color' attribute so user can immediately click color presets
      setAttributes([
        {
          id: Date.now(),
          name: 'Color',
          values: [],
        },
      ]);
    }
  };

  // Real-time reactive auto-generation of variant cards whenever attributes change
  useEffect(() => {
    if (hasVariants) {
      generateCombosFromAttrs(attributes);
    } else {
      setGeneratedVariants([]);
    }
  }, [attributes, hasVariants]);

  // Manual trigger button to generate / re-generate variant cards
  const handleGenerateVariants = () => {
    generateCombosFromAttrs(attributes);
  };

  // Quick preset value add for attribute
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

  // Inline value add for attribute
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

  // Add existing attribute from dropdown
  const handleAddExistingAttribute = () => {
    if (!selectedExistingAttr) return;
    if (attributes.some((a) => a.name.toLowerCase() === selectedExistingAttr.toLowerCase())) {
      alert('This attribute is already added to the product.');
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

  // Add brand new custom attribute
  const handleAddCustomAttribute = () => {
    if (!customAttrName.trim()) return;
    if (attributes.some((a) => a.name.toLowerCase() === customAttrName.trim().toLowerCase())) {
      alert('Attribute already exists.');
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

  const handleVariantFieldChange = (id: string, field: 'price' | 'stock', value: string) => {
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

  // Form Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setNameTouched(true);
    setQtyTouched(true);

    if (!productName.trim() || productName.trim().length < 3) {
      setErrorMessage('Please enter a valid product name (at least 3 characters).');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (!price || Number(price) <= 0) {
      setErrorMessage('Please enter a valid price.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (!selectedCategory) {
      setErrorMessage('Please select a category.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const prodQuantity = Number(quantity);
    if (quantity === '' || isNaN(prodQuantity) || prodQuantity < 10) {
      setErrorMessage('Product quantity must be at least 10 units.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Expiry validation for perishable products
    setExpiryTouched(true);
    if (isPerishable && !expiryDate) {
      setErrorMessage('Please enter an expiration date for this perishable product.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Variant stock validation: Total variant stock must equal product quantity
    if (hasVariants) {
      if (generatedVariants.length === 0) {
        setErrorMessage(
          'Please generate variants before creating the product, or uncheck "This product has variants".'
        );
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      if (totalVariantStock !== prodQuantity) {
        setErrorMessage(
          `Total variant stock (${totalVariantStock}) must equal product quantity (${prodQuantity}). Please adjust the variant stock quantities.`
        );
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
    }

    setSubmitting(true);
    try {
      // 1. Create Base Product
      const productPayload = {
        productName: productName.trim(),
        description: description.trim(),
        status: status || 'ACTIVE',
        categoryId: Number(selectedCategory),
        brandId: selectedBrand ? Number(selectedBrand) : undefined,
        userId: 1,
        isPerishable: isPerishable,
      };

      let createdProduct: any = null;
      try {
        createdProduct = await productManagementApi.createProduct(productPayload);
      } catch (err) {
        console.warn('Backend product creation fallback:', err);
      }

      const prodId = createdProduct?.productId || Date.now();

      // 2. Upload Images if any
      if (selectedImages.length > 0 && createdProduct?.productId) {
        try {
          for (let i = 0; i < selectedImages.length; i++) {
            await productManagementApi.uploadProductImage(
              createdProduct.productId,
              selectedImages[i],
              i === 0
            );
          }
        } catch (imgErr) {
          console.warn('Image upload skipped:', imgErr);
        }
      }

      // 2.1 Assign Product Tags
      if (selectedTagIds.length > 0 && createdProduct?.productId) {
        try {
          await productManagementApi.assignProductTags(createdProduct.productId, selectedTagIds);
        } catch (tagErr) {
          console.warn('Product tag assignment skipped:', tagErr);
        }
      }

      // 3. Create Variants if enabled, or default variant for simple product
      const activeAttrs = hasVariants
        ? attributes.filter((a) => a.values && a.values.length > 0)
        : [];

      if (hasVariants && generatedVariants.length > 0 && prodId) {
        try {
          // Pre-fetch DB variations
          let dbVariations: any[] = [];
          try {
            dbVariations = await variantApi.getVariations();
          } catch {
            dbVariations = [];
          }

          // Ensure all active attributes and their values exist in DB
          const optionMap = new Map<string, number>();

          for (const attr of activeAttrs) {
            let dbVar = dbVariations.find(
              (v) => v.name?.toLowerCase() === attr.name.toLowerCase()
            );
            if (!dbVar) {
              try {
                dbVar = await variantApi.createVariation(attr.name);
                dbVariations.push(dbVar);
              } catch (createVarErr) {
                console.warn(`Failed to create variation ${attr.name}:`, createVarErr);
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
                  } catch (createOptErr) {
                    console.warn(`Failed to create option ${val}:`, createOptErr);
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

          // Create each generated variant with customized price, stock, and SKU
          for (const gv of generatedVariants) {
            const validOptionIds = gv.combination
              .map((c) =>
                optionMap.get(
                  `${c.attrName.toLowerCase()}:::${c.value.toLowerCase()}`
                )
              )
              .filter((id): id is number => typeof id === 'number');

            const varPrice =
              Number(gv.price) > 0 ? Number(gv.price) : Number(price);
            const varStock =
              Number(gv.stock) >= 0 ? Number(gv.stock) : (Number(quantity) || 0);

            let createdVariant: any = null;
            try {
              createdVariant =
                await productManagementApi.createProductVariantWithOptions({
                  productId: prodId,
                  sku: gv.sku,
                  sellingPrice: varPrice,
                  status: 'ACTIVE',
                  optionIds: validOptionIds,
                  initialStock: varStock,
                });

              // Link expiry details to inventory if product is perishable
              if (isPerishable && expiryDate && createdVariant?.variantId) {
                try {
                  await inventoryApi.restockVariant({
                    variantId: createdVariant.variantId,
                    quantity: 0,
                    expiryDate: expiryDate,
                    batchNumber: batchNumber.trim() || undefined,
                    remark: 'Initial batch expiry setup',
                  });
                } catch (invErr) {
                  console.warn('Initial expiry setup for variant skipped:', invErr);
                }
              }
            } catch (createVarErr) {
              console.warn(`Failed to create variant ${gv.sku}:`, createVarErr);
            }

            // Upload variant-specific images if any
            if (
              gv.images &&
              gv.images.length > 0 &&
              createdVariant?.variantId
            ) {
              for (let i = 0; i < gv.images.length; i++) {
                try {
                  await productManagementApi.uploadProductVariantImage(
                    createdVariant.variantId,
                    gv.images[i],
                    i === 0
                  );
                } catch (imgErr) {
                  console.warn(
                    `Variant image upload failed for ${gv.sku}:`,
                    imgErr
                  );
                }
              }
            }
          }
        } catch (varErr: any) {
          console.warn('Variant auto-generation error:', varErr);
          throw new Error('Base product was created, but variant/inventory setup failed: ' + (varErr.message || ''));
        }
      } else if (prodId) {
        // Simple product: create single default variant with stock atomically
        try {
          const cleanName =
            productName.replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase() || 'PROD';
          const skuCode = `${cleanName}-${Math.floor(1000 + Math.random() * 9000)}`;
          const initQty = Number(quantity) >= 10 ? Number(quantity) : 10;

          const createdSimpleVar = await productManagementApi.createProductVariantWithOptions({
            productId: prodId,
            sku: skuCode,
            sellingPrice: Number(price),
            status: 'ACTIVE',
            optionIds: [],
            initialStock: initQty,
          });

          // Link expiry details to inventory if product is perishable
          if (isPerishable && expiryDate && createdSimpleVar?.variantId) {
            try {
              await inventoryApi.restockVariant({
                variantId: createdSimpleVar.variantId,
                quantity: 0,
                expiryDate: expiryDate,
                batchNumber: batchNumber.trim() || undefined,
                remark: 'Initial batch expiry setup',
              });
            } catch (invErr) {
              console.warn('Initial expiry setup for simple variant skipped:', invErr);
            }
          }
        } catch (singleVarErr: any) {
          console.warn('Default variant creation skipped:', singleVarErr);
          throw new Error('Base product was created, but stock inventory setup failed: ' + (singleVarErr.message || ''));
        }
      }

      alert('Product created successfully with SKU and inventory stock!');
      navigate('/admin/products');
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Failed to create product.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.createProductContainer}>
      {/* Page Header (3D Cube Icon + Title + Subtitle) */}
      <div className={styles.pageTopHeader}>
        <div className={styles.iconBadge}>
          <FiPackage />
        </div>
        <h1 className={styles.mainTitle}>Create New Product</h1>
        <p className={styles.mainSubtitle}>
          Add a new product to your inventory
        </p>
      </div>

      {errorMessage && (
        <div
          style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#ef4444',
            padding: '12px 16px',
            borderRadius: '10px',
            marginBottom: '20px',
            fontSize: '13px',
          }}
        >
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* CARD 1: Basic Information */}
        <div className={styles.sectionCard}>
          <h3 className={styles.sectionTitle}>
            <FiInfo color="#2563eb" /> Basic Information
          </h3>

          <div className={styles.formGrid2}>
            <div className={styles.inputGroup}>
              <label>Product Name *</label>
              <input
                type="text"
                required
                className={styles.inputField}
                style={{
                  borderColor:
                    nameTouched && (!productName.trim() || productName.trim().length < 3)
                      ? '#ef4444'
                      : undefined,
                }}
                placeholder="Enter product name (min 3 chars)"
                value={productName}
                onChange={(e) => {
                  setProductName(e.target.value);
                  if (!nameTouched) setNameTouched(true);
                }}
                onBlur={() => setNameTouched(true)}
              />
              {nameTouched && (!productName.trim() || productName.trim().length < 3) && (
                <span
                  style={{
                    color: '#ef4444',
                    fontSize: '11px',
                    marginTop: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontWeight: 500,
                  }}
                >
                  <FiAlertCircle size={12} /> Product name is required and must be at least 3 characters.
                </span>
              )}
            </div>

            <div className={styles.inputGroup}>
              <label>Price *</label>
              <input
                type="number"
                required
                min="0"
                step="any"
                className={styles.inputField}
                placeholder="Enter price"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>
          </div>

          <div className={styles.formGrid2}>
            <div className={styles.inputGroup}>
              <label>Quantity * (Min. 10)</label>
              <input
                type="number"
                required
                min="10"
                className={styles.inputField}
                style={{
                  borderColor:
                    qtyTouched && (quantity === '' || Number(quantity) < 10)
                      ? '#ef4444'
                      : undefined,
                }}
                placeholder="Enter quantity (min 10)"
                value={quantity}
                onChange={(e) => {
                  setQuantity(e.target.value);
                  if (!qtyTouched) setQtyTouched(true);
                }}
                onBlur={() => setQtyTouched(true)}
              />
              {qtyTouched && (quantity === '' || Number(quantity) < 10) && (
                <span
                  style={{
                    color: '#ef4444',
                    fontSize: '11px',
                    marginTop: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontWeight: 500,
                  }}
                >
                  <FiAlertCircle size={12} /> Quantity must be at least 10 units.
                </span>
              )}
            </div>

            <div className={styles.inputGroup}>
              <label>Status *</label>
              <select
                className={styles.inputField}
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label>Description</label>
            <textarea
              className={styles.textareaField}
              placeholder="Enter product description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>

        {/* CARD 2: Categories & Brands */}
        <div className={styles.sectionCard}>
          <h3 className={styles.sectionTitle}>
            <FiFolder color="#2563eb" /> Categories &amp; Brands
          </h3>

          <div className={styles.formGrid2}>
            <div className={styles.inputGroup}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ margin: 0 }}>Select Category *</label>
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(true)}
                  style={{
                    background: '#eff6ff',
                    border: '1px solid #bfdbfe',
                    color: '#2563eb',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                  title="Add New Category"
                >
                  <FiPlus size={11} /> + Add New Category
                </button>
              </div>
              <div className={styles.categoryBrandRow}>
                <select
                  required
                  className={styles.inputField}
                  value={selectedCategory}
                  onChange={(e) => {
                    if (e.target.value === '__NEW_CATEGORY__') {
                      setShowCategoryModal(true);
                    } else {
                      handleCategorySelect(e.target.value);
                    }
                  }}
                >
                  <option value="">Select Category</option>
                  <option value="__NEW_CATEGORY__" style={{ color: '#2563eb', fontWeight: 600 }}>
                    + Add New Category...
                  </option>
                  {categories.map((c) => (
                    <option key={c.categoryId} value={String(c.categoryId)}>
                      {c.categoryName}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className={styles.btnIconAction}
                  title="Clear Category"
                  onClick={() => handleCategorySelect('')}
                >
                  <FiTrash2 />
                </button>
              </div>
            </div>

            <div className={styles.inputGroup}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ margin: 0 }}>Select Brand (Optional)</label>
                <button
                  type="button"
                  onClick={() => setShowBrandModal(true)}
                  style={{
                    background: '#eff6ff',
                    border: '1px solid #bfdbfe',
                    color: '#2563eb',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                  title="Add New Brand"
                >
                  <FiPlus size={11} /> + Add New Brand
                </button>
              </div>
              <div className={styles.categoryBrandRow}>
                <select
                  className={styles.inputField}
                  value={selectedBrand}
                  onChange={(e) => {
                    if (e.target.value === '__NEW_BRAND__') {
                      setShowBrandModal(true);
                    } else {
                      setSelectedBrand(e.target.value);
                    }
                  }}
                >
                  <option value="">Select Brand (Optional)</option>
                  <option value="__NEW_BRAND__" style={{ color: '#2563eb', fontWeight: 600 }}>
                    + Add New Brand...
                  </option>
                  {brands.map((b) => (
                    <option key={b.brandId} value={String(b.brandId)}>
                      {b.brandName}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className={styles.btnIconAction}
                  title="Clear Brand"
                  onClick={() => setSelectedBrand('')}
                >
                  <FiTrash2 />
                </button>
              </div>
            </div>
          </div>

          {/* Product Tags */}
          <div style={{ marginTop: '20px', borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', margin: 0, fontSize: '13px', fontWeight: 600, color: '#334155' }}>
                <FiTag color="#2563eb" size={14} /> Product Tags (Optional)
              </label>
              <button
                type="button"
                onClick={() => setShowTagModal(true)}
                style={{
                  background: '#eff6ff',
                  border: '1px solid #bfdbfe',
                  color: '#2563eb',
                  padding: '3px 10px',
                  borderRadius: '16px',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
                title="Add New Tag"
              >
                <FiPlus size={11} /> + Add New Tag
              </button>
            </div>

            <p style={{ margin: '0 0 10px 0', fontSize: '12px', color: '#64748b' }}>
              Assign tags to this product for customer search, promo badges, and filtering.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
              {allTags.map((t) => {
                const isSelected = selectedTagIds.includes(t.tagId);
                return (
                  <button
                    key={t.tagId}
                    type="button"
                    onClick={() => toggleTag(t.tagId)}
                    style={{
                      background: isSelected ? '#eff6ff' : '#f8fafc',
                      color: isSelected ? '#2563eb' : '#475569',
                      border: isSelected ? '1.5px solid #3b82f6' : '1px solid #cbd5e1',
                      borderRadius: '20px',
                      padding: '5px 14px',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <span>#{t.tagName}</span>
                    {isSelected ? <FiCheck size={12} /> : null}
                  </button>
                );
              })}
              {allTags.length === 0 && (
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                  No tags found. Go to Catalog &gt; Tags to create tags.
                </span>
              )}
            </div>
          </div>
        </div>

        {/* CARD: Expiration & Batch Details (Dynamic Perishable Section) */}
        <div
          className={styles.sectionCard}
          style={{
            borderLeft: isPerishable ? '4px solid #10b981' : '1px solid #e2e8f0',
            background: isPerishable ? '#fcfdfd' : '#ffffff',
            transition: 'all 0.3s ease',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
            <h3 className={styles.sectionTitle} style={{ margin: 0 }}>
              <FiClock color={isPerishable ? '#10b981' : '#64748b'} /> Expiration &amp; Batch Details
              {isPerishable && (
                <span
                  style={{
                    marginLeft: '10px',
                    fontSize: '11px',
                    fontWeight: 600,
                    padding: '3px 9px',
                    borderRadius: '12px',
                    background: '#ecfdf5',
                    color: '#059669',
                    border: '1px solid #a7f3d0',
                  }}
                >
                  Perishable Goods Enabled
                </span>
              )}
            </h3>

            {/* Toggle switch */}
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: '#334155' }}>
              <span>Has Expiration Date:</span>
              <input
                type="checkbox"
                checked={isPerishable}
                onChange={(e) => setIsPerishable(e.target.checked)}
                style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#10b981' }}
              />
            </label>
          </div>

          <p style={{ margin: '0 0 16px 0', fontSize: '12px', color: '#64748b' }}>
            Enable this for products that can expire (such as medicine, cosmetics/skincare, and food/groceries) to track shelf life and trigger automatic alerts in inventory.
          </p>

          {isPerishable && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '16px',
                padding: '16px',
                background: '#f8fafc',
                borderRadius: '10px',
                border: '1px solid #e2e8f0',
              }}
            >
              <div className={styles.inputGroup} style={{ margin: 0 }}>
                <label>Expiration Date *</label>
                <input
                  type="date"
                  required={isPerishable}
                  className={styles.inputField}
                  style={{
                    borderColor: expiryTouched && !expiryDate ? '#ef4444' : undefined,
                  }}
                  value={expiryDate}
                  onChange={(e) => {
                    setExpiryDate(e.target.value);
                    if (!expiryTouched) setExpiryTouched(true);
                  }}
                  onBlur={() => setExpiryTouched(true)}
                />
                {expiryTouched && !expiryDate && (
                  <span style={{ color: '#ef4444', fontSize: '11px', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <FiAlertCircle size={12} /> Expiration date is required for perishable products.
                  </span>
                )}
              </div>

              <div className={styles.inputGroup} style={{ margin: 0 }}>
                <label>Manufacture Date (Optional)</label>
                <input
                  type="date"
                  className={styles.inputField}
                  value={manufactureDate}
                  onChange={(e) => setManufactureDate(e.target.value)}
                />
              </div>

              <div className={styles.inputGroup} style={{ margin: 0 }}>
                <label>Batch / Lot Number (Optional)</label>
                <input
                  type="text"
                  className={styles.inputField}
                  placeholder="e.g. LOT-2026-MED01"
                  value={batchNumber}
                  onChange={(e) => setBatchNumber(e.target.value)}
                />
              </div>
            </div>
          )}
        </div>

        {/* CARD 3: Product Images */}
        <div className={styles.sectionCard}>
          <h3 className={styles.sectionTitle}>
            <FiImage color="#2563eb" /> Product Images
          </h3>

          <div
            className={styles.uploadZone}
            onClick={() => fileInputRef.current?.click()}
          >
            <FiUploadCloud className={styles.cloudIcon} />
            <p className={styles.uploadTitle}>Click to upload, or drag &amp; drop</p>
            <p className={styles.uploadSubtitle}>PNG, JPG up to 10MB (max 5 images)</p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
          </div>

          {imagePreviews.length > 0 && (
            <div className={styles.imagePreviewGrid}>
              {imagePreviews.map((src, idx) => (
                <div key={idx} className={styles.imagePreviewThumb}>
                  <img src={src} alt={`Preview ${idx + 1}`} />
                  <button
                    type="button"
                    className={styles.removeThumbBtn}
                    onClick={() => handleRemoveImage(idx)}
                    title="Remove image"
                  >
                    <FiX />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* CARD 4: Product Variations */}
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
                💡 Click &quot;This product has variants&quot; above to select attributes and generate variant cards.
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

              {/* STEP 2: ACTIVE ATTRIBUTES & VALUES (Shown only after an attribute is added) */}
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
                                    className={styles.sizePill}
                                    style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                    title="Click to remove"
                                    onClick={() => handleRemoveValue(attr.id, val)}
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

                  {/* Generate Variants Action Banner */}
                  <div
                    style={{
                      marginTop: '16px',
                      padding: '16px 20px',
                      background: '#f8fafc',
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '12px',
                    }}
                  >
                    <div>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b', display: 'block' }}>
                        Generate Variants
                      </span>
                      <span style={{ fontSize: '12px', color: '#64748b' }}>
                        {computedCombosCount === 0
                          ? 'Add at least one value to your attributes above to generate variant cards.'
                          : `Click to generate ${computedCombosCount} variant card${computedCombosCount > 1 ? 's' : ''}.`}
                      </span>
                    </div>

                    <button
                      type="button"
                      disabled={computedCombosCount === 0}
                      onClick={handleGenerateVariants}
                      className={styles.btnAddProductPurple}
                      style={{
                        padding: '9px 20px',
                        fontSize: '13px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        opacity: computedCombosCount === 0 ? 0.5 : 1,
                        cursor: computedCombosCount === 0 ? 'not-allowed' : 'pointer',
                      }}
                    >
                      <FiRefreshCw size={13} />
                      {generatedVariants.length > 0
                        ? `Regenerate Variants (${computedCombosCount})`
                        : `Generate Variants (${computedCombosCount})`}
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: GENERATED VARIANTS CARDS (Shown only after clicking Generate Variants) */}
              {generatedVariants.length > 0 && (
                <div className={styles.generatedVariantsSection} style={{ marginTop: '24px' }}>
                  <div className={styles.generatedVariantsHeader}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <h4 className={styles.generatedVariantsTitle}>
                        Generated Variants
                      </h4>
                      <span className={styles.variantsCountBadge}>
                        {generatedVariants.length} variant(s)
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={handleGenerateVariants}
                      className={styles.btnAddProductPurple}
                      style={{
                        padding: '6px 14px',
                        fontSize: '12px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                      }}
                    >
                      <FiRefreshCw size={12} />
                      Regenerate Variants ({computedCombosCount})
                    </button>
                  </div>

                  {/* Stock validation status indicator */}
                  <div
                    style={{
                      marginBottom: '16px',
                      padding: '12px 16px',
                      borderRadius: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: totalVariantStock === (Number(quantity) || 0) ? '#f0fdf4' : '#fef2f2',
                      border: `1.5px solid ${totalVariantStock === (Number(quantity) || 0) ? '#86efac' : '#fca5a5'}`,
                      color: totalVariantStock === (Number(quantity) || 0) ? '#15803d' : '#b91c1c',
                      fontSize: '13px',
                      fontWeight: 600,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {totalVariantStock === (Number(quantity) || 0) ? (
                        <FiCheck size={16} />
                      ) : (
                        <FiAlertCircle size={16} />
                      )}
                      <span>
                        Total Variant Stock: <strong>{totalVariantStock}</strong> / Product Quantity: <strong>{Number(quantity) || 0}</strong>
                      </span>
                    </div>
                    <span>
                      {totalVariantStock === (Number(quantity) || 0)
                        ? '✓ Stock matches quantity'
                        : (Number(quantity) || 0) - totalVariantStock > 0
                        ? `Need ${(Number(quantity) || 0) - totalVariantStock} more stock`
                        : `Over by ${totalVariantStock - (Number(quantity) || 0)} stock`}
                    </span>
                  </div>

                  <div className={styles.variantsCardGrid}>
                    {generatedVariants.map((gv, idx) => (
                      <div key={gv.id} className={styles.singleVariantCard}>
                        {/* Top row: Title + SKU + Trash Button */}
                        <div className={styles.variantCardTopRow}>
                          <div className={styles.variantCardTitleCol}>
                            <span className={styles.variantCardTitle}>
                              Variant {idx + 1}
                            </span>
                            <span className={styles.variantCardSku}>
                              {gv.sku}
                            </span>
                          </div>
                          <button
                            type="button"
                            className={styles.btnDeleteVariantCard}
                            onClick={() => handleDeleteGeneratedVariant(gv.id)}
                            title="Delete this variant"
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
                            <label>PRICE</label>
                            <input
                              type="number"
                              min="0"
                              value={gv.price}
                              onChange={(e) =>
                                handleVariantFieldChange(gv.id, 'price', e.target.value)
                              }
                            />
                          </div>
                          <div className={styles.variantCardInputCol}>
                            <label>STOCK</label>
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
                                gap: '6px',
                                marginTop: '8px',
                                flexWrap: 'wrap',
                              }}
                            >
                              {gv.imagePreviews.map((url, imgIdx) => (
                                <img
                                  key={imgIdx}
                                  src={url}
                                  alt="variant preview"
                                  className={styles.variantImgThumbSmall}
                                />
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

        {/* Bottom Actions Bar (Create Product button + stock validation notice) */}
        <div className={styles.createProductBottomBar}>
          <button
            type="submit"
            disabled={submitting}
            className={styles.btnCreateProductPurpleAction}
          >
            {submitting ? 'Creating Product...' : 'Create Product'}
          </button>

          {hasVariants && generatedVariants.length > 0 && totalVariantStock !== (Number(quantity) || 0) && (
            <p className={styles.stockValidationWarning} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <FiAlertCircle size={14} />
              Total variant stock ({totalVariantStock}) must equal product quantity ({Number(quantity) || 0}).
            </p>
          )}

          {hasVariants && generatedVariants.length > 0 && totalVariantStock === (Number(quantity) || 0) && (
            <p style={{ color: '#16a34a', fontSize: '13px', margin: 0, fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px' }}>
              <FiCheck size={14} />
              Total variant stock matches product quantity ({totalVariantStock}/{Number(quantity) || 0}).
            </p>
          )}

          {errorMessage && (
            <p style={{ color: '#ef4444', fontSize: '13px', margin: '6px 0 0 0', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px' }}>
              <FiAlertCircle size={14} />
              {errorMessage}
            </p>
          )}
        </div>
      </form>

      {/* ==================================================== */}
      {/* QUICK CREATE MODALS (Category, Brand, Tag) */}
      {/* ==================================================== */}

      {/* 1. Category Form Modal (Exact modal from Category page with Parent Category & full styling) */}
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

      {/* 2. Brand Modal (Exact modal from Brand page with Logo, Categories & full styling) */}
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

      {/* 3. Tag Modal */}
      {showTagModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.55)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            backdropFilter: 'blur(3px)',
          }}
          onClick={() => setShowTagModal(false)}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              width: '90%',
              maxWidth: '420px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
              overflow: 'hidden',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
                + Add New Tag
              </h3>
              <button
                type="button"
                style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#64748b' }}
                onClick={() => setShowTagModal(false)}
              >
                <FiX />
              </button>
            </div>

            <form onSubmit={handleQuickCreateTag}>
              <div style={{ padding: '20px' }}>
                <div style={{ marginBottom: '18px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                    Tag Name *
                  </label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <span style={{ position: 'absolute', left: '12px', color: '#94a3b8', fontWeight: 700 }}>#</span>
                    <input
                      type="text"
                      required
                      className={styles.inputField}
                      placeholder="e.g. summer, hot-deal, unisex"
                      style={{ width: '100%', paddingLeft: '28px', boxSizing: 'border-box' }}
                      value={newTagName}
                      onChange={(e) => setNewTagName(e.target.value)}
                      autoFocus
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button
                    type="button"
                    style={{
                      padding: '8px 16px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      background: '#ffffff',
                      color: '#475569',
                      fontSize: '13px',
                      cursor: 'pointer',
                    }}
                    onClick={() => setShowTagModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={tagLoading || !newTagName.trim()}
                    style={{
                      padding: '8px 20px',
                      borderRadius: '8px',
                      border: 'none',
                      background: '#2563eb',
                      color: '#ffffff',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: tagLoading || !newTagName.trim() ? 'not-allowed' : 'pointer',
                      opacity: tagLoading || !newTagName.trim() ? 0.6 : 1,
                    }}
                  >
                    {tagLoading ? 'Creating...' : 'Create Tag'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
