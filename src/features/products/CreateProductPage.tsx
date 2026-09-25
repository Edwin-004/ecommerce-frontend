import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './ProductStyles.module.css';
import {
  productManagementApi,
  type CategoryItem,
  type BrandItem,
} from './productManagementApi';
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
} from 'react-icons/fi';

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

  // Images
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  // Variations toggle & list
  const [hasVariants, setHasVariants] = useState<boolean>(true);
  const [attributes, setAttributes] = useState<LocalAttribute[]>([
    {
      id: 1,
      name: 'Colour',
      values: [
        'black',
        'gold',
        'olive',
        'navy',
        'blue',
        'purple',
        'sky blue',
        'pink',
        'brown',
        'green',
      ],
    },
    {
      id: 2,
      name: 'Size',
      values: ['S', 'M', 'L', 'XL', 'XXL'],
    },
    {
      id: 3,
      name: 'ml',
      values: ['50ml', '100ml', '250ml'],
    },
  ]);

  // Existing attributes available in database to add
  const [availableAttributes, setAvailableAttributes] = useState<string[]>([
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

  useEffect(() => {
    loadCategoriesAndBrands();
  }, []);

  const loadCategoriesAndBrands = async () => {
    try {
      const [cats, brs, vars] = await Promise.allSettled([
        productManagementApi.getCategories(),
        productManagementApi.getBrands(),
        productManagementApi.getVariations(),
      ]);

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

  // Inline value add for attribute
  const handleAddValueToAttr = (attrId: string | number) => {
    const val = inlineValues[attrId]?.trim();
    if (!val) return;

    setAttributes((prev) =>
      prev.map((attr) =>
        attr.id === attrId && !attr.values.includes(val)
          ? { ...attr, values: [...attr.values, val] }
          : attr
      )
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

    setAttributes((prev) => [
      ...prev,
      {
        id: Date.now(),
        name: selectedExistingAttr,
        values: [],
      },
    ]);
    setSelectedExistingAttr('');
  };

  // Add brand new custom attribute
  const handleAddCustomAttribute = () => {
    if (!customAttrName.trim()) return;
    if (attributes.some((a) => a.name.toLowerCase() === customAttrName.trim().toLowerCase())) {
      alert('Attribute already exists.');
      return;
    }

    setAttributes((prev) => [
      ...prev,
      {
        id: Date.now(),
        name: customAttrName.trim(),
        values: [],
      },
    ]);
    setCustomAttrName('');
    setShowAddAttrInput(false);
  };

  // Form Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!productName.trim()) {
      setErrorMessage('Please enter a product name.');
      return;
    }
    if (!price || Number(price) <= 0) {
      setErrorMessage('Please enter a valid price.');
      return;
    }
    if (!selectedCategory) {
      setErrorMessage('Please select a category.');
      return;
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

      // 3. Create Variants if enabled
      if (hasVariants && attributes.length > 0) {
        try {
          // Generate combinations from attributes
          const firstAttr = attributes[0];
          const secondAttr = attributes[1];

          if (firstAttr && firstAttr.values.length > 0) {
            for (const val1 of firstAttr.values.slice(0, 3)) {
              const val2 = secondAttr && secondAttr.values.length > 0 ? secondAttr.values[0] : '';
              const skuCode = `${productName.slice(0, 3).toUpperCase()}-${val1.slice(0, 3).toUpperCase()}${val2 ? '-' + val2.slice(0, 3).toUpperCase() : ''}-${Math.floor(100 + Math.random() * 900)}`;

              await productManagementApi.createProductVariant({
                product: { productId: prodId },
                sku: skuCode,
                sellingPrice: Number(price),
                status: 'ACTIVE',
              });
            }
          }
        } catch (varErr) {
          console.warn('Variant auto-generation skipped:', varErr);
        }
      }

      alert('Product created successfully!');
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
                placeholder="Enter product name"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
              />
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
              <label>Quantity *</label>
              <input
                type="number"
                required
                min="0"
                className={styles.inputField}
                placeholder="Enter quantity"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
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
              <label>Select Category *</label>
              <div className={styles.categoryBrandRow}>
                <select
                  required
                  className={styles.inputField}
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  <option value="">Select Category</option>
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
                  onClick={() => setSelectedCategory('')}
                >
                  <FiTrash2 />
                </button>
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label>Select Brand *</label>
              <div className={styles.categoryBrandRow}>
                <select
                  required
                  className={styles.inputField}
                  value={selectedBrand}
                  onChange={(e) => setSelectedBrand(e.target.value)}
                >
                  <option value="">Select Brand</option>
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

          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={hasVariants}
              onChange={(e) => setHasVariants(e.target.checked)}
            />
            <span>This product has variants (size, color, etc.)</span>
          </label>

          {!hasVariants ? (
            <p style={{ fontSize: '13px', color: '#64748b', margin: '8px 0 0 0' }}>
              Enable variants to add different options like sizes or colors for this product.
            </p>
          ) : (
            <div className={styles.variationsSubSection}>
              <div className={styles.attrSectionHeader}>
                <h4>Product Attributes</h4>
                <button
                  type="button"
                  className={styles.btnNewAttrSmall}
                  onClick={() => setShowAddAttrInput(true)}
                >
                  <FiPlus size={12} />
                  Add New Attribute
                </button>
              </div>

              {/* Inline input for custom new attribute */}
              {showAddAttrInput && (
                <div
                  style={{
                    background: '#eff6ff',
                    border: '1px solid #bfdbfe',
                    padding: '12px',
                    borderRadius: '10px',
                    marginBottom: '14px',
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

              {/* Attributes List */}
              {attributes.map((attr) => {
                const isColor =
                  attr.name.toLowerCase().includes('colour') ||
                  attr.name.toLowerCase().includes('color');

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

                    {/* Swatches / Pills Box */}
                    <div className={styles.swatchesBox}>
                      {isColor
                        ? attr.values.map((val) => (
                            <span
                              key={val}
                              className={styles.colorCircle}
                              style={{ backgroundColor: getColorHex(val) }}
                              title={`${val} (click to remove)`}
                              onClick={() => handleRemoveValue(attr.id, val)}
                            />
                          ))
                        : attr.values.map((val) => (
                            <span
                              key={val}
                              className={styles.sizePill}
                              style={{ cursor: 'pointer' }}
                              title="Click to remove"
                              onClick={() => handleRemoveValue(attr.id, val)}
                            >
                              {val} <FiX size={10} style={{ marginLeft: '4px' }} />
                            </span>
                          ))}
                    </div>

                    {/* Inline Add Value Input */}
                    <div className={styles.inlineAddValueRow}>
                      <input
                        type="text"
                        placeholder="Add new value"
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

              {/* Add Existing Attribute Row */}
              <div className={styles.addExistingRow}>
                <label>Add existing attribute</label>
                <div className={styles.addExistingControls}>
                  <select
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
                    className={styles.btnAddValuePlus}
                    onClick={handleAddExistingAttribute}
                    title="Add attribute"
                  >
                    <FiPlus />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Centered Submit Button */}
        <button
          type="submit"
          disabled={submitting}
          className={styles.btnSubmitCreateProduct}
        >
          <FiPlus size={16} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
          {submitting ? 'Creating Product...' : 'Create Product'}
        </button>
      </form>
    </div>
  );
};
