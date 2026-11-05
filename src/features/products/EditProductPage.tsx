import { toast } from 'react-toastify';
import { BackButton } from '../../components/common/BackButton';
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
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
  FiImage,
  FiPlus,
} from 'react-icons/fi';


export const EditProductPage: React.FC = () => {
  const { id: pathId } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const id = searchParams.get('id') || pathId;
  const productId = Number(id);

  // Loading & error
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');

  // Form states
  const [productName, setProductName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [status, setStatus] = useState<string>('ACTIVE');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);

  // Perishable / Expiry Details
  const [isPerishable, setIsPerishable] = useState<boolean>(false);
  const [expiryDate, setExpiryDate] = useState<string>('');
  const [batchNumber, setBatchNumber] = useState<string>('');

  // Images
  const [existingImages, setExistingImages] = useState<any[]>([]);
  const [newImageFiles, setNewImageFiles] = useState<File[]>([]);
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([]);

  // Image Action States
  const [imageActionLoading, setImageActionLoading] = useState<number | null>(null);
  const [replacingTarget, setReplacingTarget] = useState<{ imageId: number; isPrimary: boolean } | null>(null);
  const [uploadingNewImages, setUploadingNewImages] = useState<boolean>(false);
  const replaceInputRef = React.useRef<HTMLInputElement | null>(null);

  // Variants list
  const [variants, setVariants] = useState<any[]>([]);

  // Dropdown lists
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [brands, setBrands] = useState<BrandItem[]>([]);
  const [allTags, setAllTags] = useState<{ tagId: number; tagName: string }[]>([]);

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

  useEffect(() => {
    if (!productId || isNaN(productId)) {
      setErrorMessage('Invalid Product ID');
      setLoading(false);
      return;
    }
    loadAllData();
  }, [productId]);

  const loadAllData = async () => {
    try {
      setLoading(true);
      setErrorMessage('');

      // 1. Fetch Lookups
      const [catsRes, brandsRes, tagsRes, fullCatsRes] = await Promise.allSettled([
        productManagementApi.getCategories(),
        productManagementApi.getBrands(),
        tagApi.getAllTags(0, 100),
        categoryApi.getAllCategories(0, 1000),
      ]);

      if (catsRes.status === 'fulfilled') setCategories(catsRes.value);
      if (brandsRes.status === 'fulfilled') setBrands(brandsRes.value);
      if (tagsRes.status === 'fulfilled' && tagsRes.value?.content) {
        setAllTags(tagsRes.value.content.map((t: any) => ({ tagId: t.tagId, tagName: t.tagName })));
      }
      if (fullCatsRes.status === 'fulfilled' && fullCatsRes.value?.content) {
        setAllCategoriesFull(fullCatsRes.value.content);
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

      // 5. Fetch Variants & Inventory
      try {
        const vars = await productManagementApi.getVariantsByProductId(productId);
        if (Array.isArray(vars)) {
          try {
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
            setVariants(withImgs);
          } catch {
            setVariants(vars);
          }
        } else {
          setVariants([]);
        }

        if (vars && vars.length > 0) {
          // Check inventory of first variant for perishable details
          const firstVariantId = vars[0].variantId;
          const inv = await inventoryApi.getInventoryByVariantId(firstVariantId);
          if (inv) {
            setIsPerishable(Boolean(inv.isPerishable));
            if (inv.expiryDate) setExpiryDate(inv.expiryDate);
            if (inv.batchNumber) setBatchNumber(inv.batchNumber);
          }
        }
      } catch {
        setVariants([]);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load product details');
    } finally {
      setLoading(false);
    }
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

  // Existing Image Management Handlers
  const handleDeleteExistingImage = async (imageId: number) => {
    if (!window.confirm('Are you sure you want to delete this product image?')) return;
    try {
      setImageActionLoading(imageId);
      await productManagementApi.deleteProductImage(imageId);
      const updated = existingImages.filter((img) => img.imageId !== imageId);
      setExistingImages(updated);
      setSuccessMessage('Image deleted successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to delete image');
      setTimeout(() => setErrorMessage(''), 4000);
    } finally {
      setImageActionLoading(null);
    }
  };

  const handleSetPrimaryImage = async (imageId: number) => {
    try {
      setImageActionLoading(imageId);
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
    } finally {
      setImageActionLoading(null);
    }
  };

  const handleOpenReplace = (imageId: number, isPrimary: boolean) => {
    setReplacingTarget({ imageId, isPrimary });
    replaceInputRef.current?.click();
  };

  // Variant Editing States & Handlers
  const [savingVariantId, setSavingVariantId] = useState<number | null>(null);
  const [uploadingVariantId, setUploadingVariantId] = useState<number | null>(null);
  const [replacingVariantImage, setReplacingVariantImage] = useState<{ variantId: number; imageId: number } | null>(null);
  const variantReplaceInputRef = React.useRef<HTMLInputElement | null>(null);

  const handleVariantFieldChange = (variantId: number, field: string, value: any) => {
    setVariants((prev) =>
      prev.map((v) => (v.variantId === variantId ? { ...v, [field]: value } : v))
    );
  };

  const handleSaveVariant = async (v: any) => {
    try {
      setSavingVariantId(v.variantId);
      await variantApi.updateProductVariant(v.variantId, {
        sku: v.sku?.trim(),
        sellingPrice: Number(v.sellingPrice) || 0,
        costPrice: v.costPrice !== '' && v.costPrice !== undefined ? Number(v.costPrice) : undefined,
        status: v.status || 'ACTIVE',
      });

      toast.success(`Variant ${v.sku || '#' + v.variantId} updated successfully!`);
    } catch (err: any) {
      console.error('Failed to update variant:', err);
      toast.error(err.message || 'Failed to update variant');
    } finally {
      setSavingVariantId(null);
    }
  };

  const handleDeleteVariant = async (variantId: number) => {
    try {
      await variantApi.deleteProductVariant(variantId);
      setVariants((prev) =>
        prev.map((v) => (v.variantId === variantId ? { ...v, status: 'INACTIVE' } : v))
      );
      toast.success('Variant deactivated successfully!');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to deactivate variant');
    }
  };

  const handleOpenVariantImageReplace = (variantId: number, imageId: number) => {
    setReplacingVariantImage({ variantId, imageId });
    variantReplaceInputRef.current?.click();
  };

  const handleVariantImageReplaceFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !replacingVariantImage) return;

    const { variantId, imageId } = replacingVariantImage;
    try {
      setUploadingVariantId(variantId);
      const uploaded = await productManagementApi.uploadProductVariantImage(variantId, file);
      try {
        await productManagementApi.deleteVariantImage(imageId);
      } catch (delErr) {
        console.warn('Old variant image deletion skipped:', delErr);
      }
      setVariants((prev) =>
        prev.map((v) =>
          v.variantId === variantId
            ? {
                ...v,
                images: (v.images || [])
                  .filter((img: any) => img.productVariantImageId !== imageId)
                  .concat({
                    productVariantImageId: uploaded.productVariantImageId,
                    imageUrl: uploaded.imageUrl,
                    isPrimary: Boolean(uploaded.isPrimary),
                  }),
              }
            : v
        )
      );
      toast.success('Variant photo replaced successfully!');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to replace variant photo');
    } finally {
      setUploadingVariantId(null);
      setReplacingVariantImage(null);
      if (variantReplaceInputRef.current) variantReplaceInputRef.current.value = '';
    }
  };

  // Variant Image Handlers
  const handleUploadVariantImage = async (variantId: number, file: File) => {
    try {
      setUploadingVariantId(variantId);
      const uploaded = await productManagementApi.uploadProductVariantImage(variantId, file);
      const newImgObj = {
        productVariantImageId: uploaded.productVariantImageId,
        imageUrl: uploaded.imageUrl,
        isPrimary: Boolean(uploaded.isPrimary),
      };
      setVariants((prev) =>
        prev.map((v) =>
          v.variantId === variantId
            ? {
                ...v,
                images: [...(v.images || []), newImgObj],
              }
            : v
        )
      );
      toast.success('Variant photo added successfully!');
    } catch (err: any) {
      console.error('Failed to upload variant image:', err);
      toast.error(err.message || 'Failed to upload variant photo');
    } finally {
      setUploadingVariantId(null);
    }
  };

  const handleDeleteVariantImage = async (variantId: number, imageId: number) => {
    try {
      await productManagementApi.deleteVariantImage(imageId);
      setVariants((prev) =>
        prev.map((v) =>
          v.variantId === variantId
            ? {
                ...v,
                images: (v.images || []).filter(
                  (img: any) => img.productVariantImageId !== imageId
                ),
              }
            : v
        )
      );
      toast.success('Variant photo deleted successfully!');
    } catch (err: any) {
      console.error('Failed to delete variant image:', err);
      toast.error(err.message || 'Failed to delete variant photo');
    }
  };

  const handleReplaceFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !replacingTarget) return;

    const { imageId, isPrimary } = replacingTarget;
    try {
      setImageActionLoading(imageId);
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
      setImageActionLoading(null);
      setReplacingTarget(null);
      if (replaceInputRef.current) replaceInputRef.current.value = '';
    }
  };

  const handleUploadNewImagesNow = async () => {
    if (newImageFiles.length === 0) return;
    setUploadingNewImages(true);
    try {
      const hasPrimary = existingImages.some((img) => img.isPrimary);
      const uploadedList: any[] = [];
      for (let i = 0; i < newImageFiles.length; i++) {
        const isPrimary = !hasPrimary && i === 0;
        const res = await productManagementApi.uploadProductImage(productId, newImageFiles[i], isPrimary);
        uploadedList.push(res);
      }
      setExistingImages((prev) => [...prev, ...uploadedList]);
      setNewImageFiles([]);
      setNewImagePreviews([]);
      setSuccessMessage(uploadedList.length + ' image(s) uploaded successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to upload new images');
      setTimeout(() => setErrorMessage(''), 4000);
    } finally {
      setUploadingNewImages(false);
    }
  };

  // Quick Create Handlers
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
      setSelectedCategory(String(res.categoryId));
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
      toast.error(err.response?.data?.message || err.message || 'Failed to create brand');
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
      toast.error(err.message || 'Failed to create tag');
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

      // 3. Upload New Images
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

      // 4. Update Expiry Details on Variants Inventory if perishable
      if (isPerishable && expiryDate && variants.length > 0) {
        for (const v of variants) {
          try {
            await inventoryApi.restockVariant({
              variantId: v.variantId,
              quantity: 0,
              expiryDate: expiryDate,
              batchNumber: batchNumber.trim() || undefined,
              remark: 'Updated product expiration details',
            });
          } catch (invErr) {
            console.warn('Variant inventory expiry update skipped:', invErr);
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
            <p className={styles.mainSubtitle} style={{ textAlign: 'left', margin: 0 }}>Update product specifications, category, brand, tags, and expiry tracking</p>
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className={styles.errorAlertBox} style={{ marginBottom: '20px' }}>
          <FiAlertCircle size={18} />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div style={{
          background: '#ecfdf5',
          border: '1px solid #a7f3d0',
          color: '#065f46',
          padding: '12px 18px',
          borderRadius: '10px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontWeight: 600
        }}>
          <FiCheck size={18} />
          <span>{successMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
          {/* Left Column: Core Specs & Details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* General Info Card */}
            <div className={styles.card} style={{ background: '#fff', borderRadius: '14px', padding: '24px', border: '1px solid #edf0f5' }}>
              <h2 style={{ fontSize: '14px', fontWeight: 600, margin: '0 0 16px 0', color: '#0f172a' }}>
                General Information
              </h2>

              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Product Name <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="e.g. Premium Cotton T-Shirt"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '14px',
                    outline: 'none',
                  }}
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
                  placeholder="Detailed product description, materials, features..."
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '14px',
                    outline: 'none',
                    resize: 'vertical',
                  }}
                />
              </div>
            </div>

            {/* Expiration & Perishable Details Card */}
            <div className={styles.card} style={{ background: '#fff', borderRadius: '14px', padding: '24px', border: '1px solid #edf0f5' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FiClock color="#f59e0b" size={18} />
                  <h2 style={{ fontSize: '14px', fontWeight: 600, margin: 0, color: '#0f172a' }}>
                    Expiration &amp; Batch Details
                  </h2>
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: '#334155' }}>
                  <input
                    type="checkbox"
                    checked={isPerishable}
                    onChange={(e) => setIsPerishable(e.target.checked)}
                  />
                  Is Perishable Product
                </label>
              </div>

              {isPerishable && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', background: '#fffbeb', padding: '16px', borderRadius: '10px', border: '1px solid #fef3c7' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#92400e', marginBottom: '6px' }}>
                      Expiration Date <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <DatePicker
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(e.target.value)}
                      inputStyle={{
                        border: '1px solid #fcd34d',
                        background: '#ffffff',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#92400e', marginBottom: '6px' }}>
                      Batch Number
                    </label>
                    <input
                      type="text"
                      value={batchNumber}
                      onChange={(e) => setBatchNumber(e.target.value)}
                      placeholder="e.g. BATCH-2026-X1"
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: '8px',
                        border: '1px solid #fcd34d',
                        background: '#ffffff',
                        fontSize: '13px',
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Product Images Card */}
            <div className={styles.card} style={{ background: '#fff', borderRadius: '14px', padding: '24px', border: '1px solid #edf0f5' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <h2 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FiImage size={18} color="#2563eb" /> Product Media &amp; Images
                  </h2>
                  <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#64748b' }}>
                    Manage gallery images, change primary display photo, replace, or delete.
                  </p>
                </div>
                {existingImages.length > 0 && (
                  <span style={{ fontSize: '12px', fontWeight: 600, background: '#eff6ff', color: '#2563eb', padding: '4px 10px', borderRadius: '20px' }}>
                    {existingImages.length} image{existingImages.length > 1 ? 's' : ''} in gallery
                  </span>
                )}
              </div>

              {/* Hidden file input for Replace */}
              <input
                ref={replaceInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleReplaceFileChange}
              />

              {/* Existing Images Gallery */}
              {existingImages.length > 0 ? (
                <div style={{ marginBottom: '22px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '10px' }}>
                    Current Gallery Photos:
                  </label>
                  <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                    {existingImages.map((img: any) => (
                      <div
                        key={img.imageId}
                        style={{
                          width: '130px',
                          borderRadius: '12px',
                          border: img.isPrimary ? '2px solid #2563eb' : '1px solid #e2e8f0',
                          background: '#fff',
                          overflow: 'hidden',
                          position: 'relative',
                          boxShadow: img.isPrimary ? '0 3px 10px rgba(37,99,235,0.2)' : '0 1px 3px rgba(0,0,0,0.06)',
                          display: 'flex',
                          flexDirection: 'column',
                          transition: 'all 0.2s',
                        }}
                      >
                        {/* Image Thumbnail */}
                        <div style={{ position: 'relative', width: '100%', height: '110px', background: '#f8fafc' }}>
                          <img
                            src={getAssetUrl(img.imageUrl)}
                            alt="product"
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />

                          {/* Primary Badge */}
                          {img.isPrimary && (
                            <span
                              style={{
                                position: 'absolute',
                                top: '6px',
                                left: '6px',
                                background: '#2563eb',
                                color: '#fff',
                                fontSize: '9px',
                                fontWeight: 700,
                                padding: '2px 6px',
                                borderRadius: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '3px',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.25)',
                              }}
                            >
                              <FiStar size={9} style={{ fill: '#fff' }} /> PRIMARY
                            </span>
                          )}

                          {/* Loading Overlay during Action */}
                          {imageActionLoading === img.imageId && (
                            <div
                              style={{
                                position: 'absolute',
                                inset: 0,
                                background: 'rgba(255,255,255,0.85)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '11px',
                                fontWeight: 600,
                                color: '#2563eb',
                              }}
                            >
                              <FiRefreshCw size={20} className={styles.exportSpinner} />
                            </div>
                          )}
                        </div>

                        {/* Actions Toolbar */}
                        <div
                          style={{
                            padding: '6px 8px',
                            background: '#f8fafc',
                            borderTop: '1px solid #e2e8f0',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '4px',
                          }}
                        >
                          {!img.isPrimary ? (
                            <button
                              type="button"
                              title="Set as Primary display image"
                              onClick={() => handleSetPrimaryImage(img.imageId)}
                              disabled={imageActionLoading !== null}
                              style={{
                                flex: 1,
                                padding: '3px 6px',
                                fontSize: '10px',
                                fontWeight: 600,
                                borderRadius: '5px',
                                border: '1px solid #cbd5e1',
                                background: '#fff',
                                color: '#334155',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '3px',
                              }}
                            >
                              <FiStar size={10} color="#f59e0b" /> Primary
                            </button>
                          ) : (
                            <span style={{ flex: 1, fontSize: '10px', fontWeight: 700, color: '#2563eb', textAlign: 'center' }}>
                              Main
                            </span>
                          )}

                          {/* Replace Button */}
                          <button
                            type="button"
                            title="Replace this image file"
                            onClick={() => handleOpenReplace(img.imageId, img.isPrimary)}
                            disabled={imageActionLoading !== null}
                            style={{
                              padding: '3px 6px',
                              fontSize: '11px',
                              borderRadius: '5px',
                              border: '1px solid #cbd5e1',
                              background: '#fff',
                              color: '#475569',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <FiRefreshCw size={11} />
                          </button>

                          {/* Delete Button */}
                          <button
                            type="button"
                            title="Delete this image"
                            onClick={() => handleDeleteExistingImage(img.imageId)}
                            disabled={imageActionLoading !== null}
                            style={{
                              padding: '3px 6px',
                              fontSize: '11px',
                              borderRadius: '5px',
                              border: '1px solid #fecaca',
                              background: '#fff',
                              color: '#ef4444',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <FiTrash2 size={11} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '10px', border: '1px dashed #cbd5e1', marginBottom: '18px', textAlign: 'center' }}>
                  <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>No images currently attached to this product.</p>
                </div>
              )}

              {/* Add More Images Section */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>
                  Add More Images
                </label>
                <div
                  style={{
                    border: '2px dashed #cbd5e1',
                    borderRadius: '10px',
                    padding: '20px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    background: '#f8fafc',
                  }}
                  onClick={() => document.getElementById('edit-product-img-input')?.click()}
                >
                  <FiUploadCloud size={28} color="#64748b" style={{ marginBottom: '6px' }} />
                  <p style={{ margin: 0, fontSize: '13px', color: '#475569', fontWeight: 500 }}>
                    Click to select files from device
                  </p>
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>Supports PNG, JPG, JPEG, WEBP</span>
                  <input
                    id="edit-product-img-input"
                    type="file"
                    multiple
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleImageFileChange}
                  />
                </div>

                {/* Staged New Images Previews */}
                {newImagePreviews.length > 0 && (
                  <div style={{ marginTop: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>
                        Selected New Files ({newImagePreviews.length})
                      </span>
                      <button
                        type="button"
                        onClick={handleUploadNewImagesNow}
                        disabled={uploadingNewImages}
                        style={{
                          background: '#2563eb',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '5px 12px',
                          fontSize: '11px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px',
                        }}
                      >
                        {uploadingNewImages ? (
                          <>
                            <FiRefreshCw size={11} className={styles.exportSpinner} /> Uploading...
                          </>
                        ) : (
                          <>
                            <FiUploadCloud size={12} /> Upload Now ({newImagePreviews.length})
                          </>
                        )}
                      </button>
                    </div>

                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                      {newImagePreviews.map((url, i) => (
                        <div
                          key={i}
                          style={{
                            width: '84px',
                            height: '84px',
                            borderRadius: '8px',
                            border: '1px solid #93c5fd',
                            overflow: 'hidden',
                            position: 'relative',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                          }}
                        >
                          <img src={url} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          <button
                            type="button"
                            title="Discard"
                            onClick={() => handleRemoveNewImage(i)}
                            style={{
                              position: 'absolute',
                              top: '3px',
                              right: '3px',
                              background: 'rgba(239,68,68,0.9)',
                              border: 'none',
                              color: '#fff',
                              borderRadius: '50%',
                              width: '20px',
                              height: '20px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                            }}
                          >
                            <FiX size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Existing Variants Management Card */}
            <div className={styles.card} style={{ background: '#fff', borderRadius: '14px', padding: '24px', border: '1px solid #edf0f5' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <h2 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: '#0f172a' }}>
                    Associated Variants ({variants.length})
                  </h2>
                  <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#64748b' }}>
                    Edit price, cost, stock, status, and photos directly for each variant
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

              {/* Hidden file input for Variant Photo Replace */}
              <input
                ref={variantReplaceInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleVariantImageReplaceFileChange}
              />

              {variants.length === 0 ? (
                <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>No variants registered for this product.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {variants.map((v) => (
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
                      {/* Variant Card Header */}
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
                              v.attributeSummary.split('|').map((part: string, idx: number) => (
                                <span
                                  key={idx}
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

                        {/* Quick Action Buttons */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <button
                            type="button"
                            disabled={savingVariantId === v.variantId}
                            onClick={() => handleSaveVariant(v)}
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

                          {v.status === 'ACTIVE' ? (
                            <button
                              type="button"
                              onClick={() => handleDeleteVariant(v.variantId)}
                              title="Deactivate variant"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                background: '#fff',
                                color: '#ef4444',
                                border: '1px solid #fecaca',
                                borderRadius: '7px',
                                padding: '5px 10px',
                                fontSize: '11px',
                                fontWeight: 600,
                                cursor: 'pointer',
                              }}
                            >
                              <FiTrash2 size={11} /> Deactivate
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleVariantFieldChange(v.variantId, 'status', 'ACTIVE')}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                background: '#ecfdf5',
                                color: '#059669',
                                border: '1px solid #a7f3d0',
                                borderRadius: '7px',
                                padding: '5px 10px',
                                fontSize: '11px',
                                fontWeight: 600,
                                cursor: 'pointer',
                              }}
                            >
                              <FiCheck size={11} /> Activate
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Variant Inputs Grid */}
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                        gap: '10px',
                        background: '#ffffff',
                        padding: '12px',
                        borderRadius: '10px',
                        border: '1px solid #e2e8f0',
                        marginBottom: '12px'
                      }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                            SKU
                          </label>
                          <input
                            type="text"
                            value={v.sku || ''}
                            onChange={(e) => handleVariantFieldChange(v.variantId, 'sku', e.target.value)}
                            style={{
                              width: '100%',
                              padding: '6px 10px',
                              borderRadius: '6px',
                              border: '1px solid #cbd5e1',
                              fontSize: '12px',
                              fontWeight: 600,
                              fontFamily: 'monospace',
                              color: '#1e293b',
                              outline: 'none',
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
                            onChange={(e) => handleVariantFieldChange(v.variantId, 'sellingPrice', e.target.value)}
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
                            onChange={(e) => handleVariantFieldChange(v.variantId, 'costPrice', e.target.value)}
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
                            onChange={(e) => handleVariantFieldChange(v.variantId, 'status', e.target.value)}
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

                      {/* Variant Photos and Edit/Replace Toolbar */}
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b' }}>
                            Variant Photos ({v.images?.length || 0})
                          </span>
                          {uploadingVariantId === v.variantId && (
                            <span style={{ fontSize: '11px', color: '#2563eb', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <FiRefreshCw size={11} className={styles.exportSpinner} /> Updating photo...
                            </span>
                          )}
                        </div>

                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                          {v.images && v.images.length > 0 ? (
                            v.images.map((img: any) => (
                              <div
                                key={img.productVariantImageId}
                                style={{
                                  position: 'relative',
                                  width: '56px',
                                  height: '56px',
                                  borderRadius: '8px',
                                  border: '1px solid #cbd5e1',
                                  background: '#fff',
                                  overflow: 'hidden',
                                  boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                                }}
                              >
                                <img
                                  src={getAssetUrl(img.imageUrl)}
                                  alt="variant"
                                  style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                    display: 'block',
                                  }}
                                />

                                {/* Replace Button Overlay */}
                                <button
                                  type="button"
                                  onClick={() => handleOpenVariantImageReplace(v.variantId, img.productVariantImageId)}
                                  title="Replace this photo"
                                  style={{
                                    position: 'absolute',
                                    bottom: '2px',
                                    left: '2px',
                                    width: '20px',
                                    height: '20px',
                                    borderRadius: '4px',
                                    background: 'rgba(15, 23, 42, 0.75)',
                                    color: '#fff',
                                    border: 'none',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    padding: 0,
                                  }}
                                >
                                  <FiRefreshCw size={10} />
                                </button>

                                {/* Delete Button Overlay */}
                                <button
                                  type="button"
                                  onClick={() => handleDeleteVariantImage(v.variantId, img.productVariantImageId)}
                                  title="Delete this photo"
                                  style={{
                                    position: 'absolute',
                                    top: '2px',
                                    right: '2px',
                                    width: '20px',
                                    height: '20px',
                                    borderRadius: '50%',
                                    background: '#ef4444',
                                    color: '#fff',
                                    border: 'none',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '10px',
                                    fontWeight: 'bold',
                                    cursor: 'pointer',
                                    padding: 0,
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                                  }}
                                >
                                  ✕
                                </button>
                              </div>
                            ))
                          ) : (
                            <span style={{ fontSize: '11px', color: '#94a3b8', fontStyle: 'italic' }}>
                              No photos registered for this variant
                            </span>
                          )}

                          {/* Upload Photo Button for this variant */}
                          <button
                            type="button"
                            onClick={() => document.getElementById(`variant-photo-input-${v.variantId}`)?.click()}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                              padding: '7px 12px',
                              borderRadius: '8px',
                              border: '1px dashed #6366f1',
                              color: '#6366f1',
                              fontSize: '11px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              background: '#ffffff',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            <FiPlus size={13} /> Add Photo
                          </button>
                          <input
                            id={`variant-photo-input-${v.variantId}`}
                            type="file"
                            accept="image/*"
                            style={{ display: 'none' }}
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                handleUploadVariantImage(v.variantId, e.target.files[0]);
                                e.target.value = '';
                              }
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
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
                  background: '#f8fafc',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: status === 'ACTIVE' ? '#059669' : '#64748b',
                }}
              >
                <option value="ACTIVE">ACTIVE (Published)</option>
                <option value="INACTIVE">INACTIVE (Draft)</option>
              </select>
            </div>

            {/* Category Card */}
            <div className={styles.card} style={{ background: '#fff', borderRadius: '14px', padding: '20px', border: '1px solid #edf0f5' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label style={{ fontSize: '13px', fontWeight: 700, color: '#334155' }}>
                  Category <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(true)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#2563eb',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  + Add New
                </button>
              </div>

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13px',
                }}
                required
              >
                <option value="">Select Category</option>
                {categories.map((c) => (
                  <option key={c.categoryId} value={c.categoryId}>
                    {c.categoryName}
                  </option>
                ))}
              </select>
            </div>

            {/* Brand Card */}
            <div className={styles.card} style={{ background: '#fff', borderRadius: '14px', padding: '20px', border: '1px solid #edf0f5' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label style={{ fontSize: '13px', fontWeight: 700, color: '#334155' }}>
                  Brand
                </label>
                <button
                  type="button"
                  onClick={() => setShowBrandModal(true)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#2563eb',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  + Add New
                </button>
              </div>

              <select
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13px',
                }}
              >
                <option value="">None / Unbranded</option>
                {brands.map((b) => (
                  <option key={b.brandId} value={b.brandId}>
                    {b.brandName}
                  </option>
                ))}
              </select>
            </div>

            {/* Tags Card */}
            <div className={styles.card} style={{ background: '#fff', borderRadius: '14px', padding: '20px', border: '1px solid #edf0f5' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <label style={{ fontSize: '13px', fontWeight: 700, color: '#334155' }}>
                  Tags
                </label>
                <button
                  type="button"
                  onClick={() => setShowTagModal(true)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#2563eb',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  + Add Tag
                </button>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {allTags.map((tag) => {
                  const isSelected = selectedTagIds.includes(tag.tagId);
                  return (
                    <button
                      type="button"
                      key={tag.tagId}
                      onClick={() => {
                        setSelectedTagIds((prev) =>
                          isSelected ? prev.filter((id) => id !== tag.tagId) : [...prev, tag.tagId]
                        );
                      }}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: 600,
                        border: '1px solid',
                        borderColor: isSelected ? '#2563eb' : '#e2e8f0',
                        background: isSelected ? '#eff6ff' : '#ffffff',
                        color: isSelected ? '#1d4ed8' : '#475569',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <FiTag size={10} />
                      {tag.tagName}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
              <button
                type="submit"
                disabled={submitting}
                className={styles.btnPrimary}
                style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: '14px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                <FiSave size={16} />
                {submitting ? 'Saving Changes...' : 'Save Product Changes'}
              </button>

              <button
                type="button"
                className={styles.btnActionOutline}
                onClick={() => navigate('/admin/products')}
                style={{
                  width: '100%',
                  padding: '10px',
                  textAlign: 'center',
                  justifyContent: 'center',
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* Quick Category Form Modal (Exact modal from Category page with Parent Category & full styling) */}
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

      {/* Quick Brand Modal (Exact modal from Brand page with Logo, Categories & full styling) */}
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
        <div className={styles.modalOverlay}>
          <div className={styles.modalBox} style={{ maxWidth: '380px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>+ Add New Tag</h3>
              <button type="button" onClick={() => setShowTagModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <FiX size={18} />
              </button>
            </div>
            <form onSubmit={handleQuickCreateTag}>
              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                  Tag Name *
                </label>
                <input
                  type="text"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  placeholder="e.g. popular"
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  required
                />
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" className={styles.btnActionOutline} onClick={() => setShowTagModal(false)}>
                  Cancel
                </button>
                <button type="submit" disabled={tagLoading} className={styles.btnPrimary}>
                  {tagLoading ? 'Creating...' : 'Create Tag'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default EditProductPage;
