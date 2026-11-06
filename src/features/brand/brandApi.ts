import api from '../../utils/axiosConfig';

// =====================================================
// TYPES
// =====================================================

export type BrandStatus =
  | 'ACTIVE'
  | 'INACTIVE';

// =====================================================
// BRAND RESPONSE
// =====================================================

export interface Brand {
  brandId: number;
  brandName: string;
  brandLogoUrl: string | null;
  description: string | null;
  status: BrandStatus;
  createdAt: string;
  modifiedAt: string;
  categoryIds: number[];
}

// =====================================================
// BRAND REQUEST
// =====================================================

export interface BrandRequest {
  brandName: string;
  brandLogoUrl: string;
  description: string;
  status: BrandStatus;
  categoryIds: number[];
}

// =====================================================
// PAGE RESPONSE
// =====================================================

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

// =====================================================
// GET BRANDS (SEARCH + STATUS + PAGINATION)
// =====================================================

export async function getBrands(
  page = 0,
  size = 10,
  keyword = '',
  status: BrandStatus | 'ALL' | '' = '',
  sortBy = 'brandName',
  sortDir: 'asc' | 'desc' = 'asc'
): Promise<PageResponse<Brand>> {
  const trimmedKeyword = keyword.trim();

  const response = await api.get<PageResponse<Brand>>('/brands', {
    params: {
      page,
      size,
      sort: `${sortBy},${sortDir}`,
      keyword: trimmedKeyword || undefined,
      status: (status && status !== 'ALL') ? status : undefined,
    },
  });

  return response.data;
}

// =====================================================
// CREATE BRAND
// =====================================================

export async function createBrand(
  data: BrandRequest,
  file: File | null
): Promise<Brand> {
  const formData = new FormData();

  formData.append(
    'request',
    new Blob([JSON.stringify(data)], {
      type: 'application/json',
    })
  );

  if (file) {
    formData.append('file', file);
  }

  const response = await api.post<Brand>('/brands', formData);
  return response.data;
}

// =====================================================
// UPDATE BRAND
// =====================================================

export async function updateBrand(
  brandId: number,
  data: BrandRequest,
  file: File | null
): Promise<Brand> {
  const formData = new FormData();

  formData.append(
    'request',
    new Blob([JSON.stringify(data)], {
      type: 'application/json',
    })
  );

  if (file) {
    formData.append('file', file);
  }

  const response = await api.put<Brand>(`/brands/${brandId}`, formData);
  return response.data;
}
