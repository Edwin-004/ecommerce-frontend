import { apiFetch } from '../../utils/api';

export type BrandStatus =
  | 'ACTIVE'
  | 'INACTIVE';

export interface Brand {
  brandId: number;
  brandName: string;
  brandLogoUrl: string | null;
  description: string | null;
  status: BrandStatus;
  createdAt: string;
  modifiedAt: string;
}

export interface BrandRequest {
  brandName: string;
  brandLogoUrl: string;
  description: string;
  status: BrandStatus;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

const ENDPOINT =
  '/api/backoffice/brands';

// =====================================================
// GET BRANDS
// =====================================================

export async function getBrands(
  page = 0,
  size = 10,
  keyword = '',
  status: BrandStatus | '' = ''
): Promise<PageResponse<Brand>> {

  const params = new URLSearchParams();

  params.set(
    'page',
    String(page)
  );

  params.set(
    'size',
    String(size)
  );

  params.set(
    'sort',
    'brandName,asc'
  );

  if (keyword.trim()) {
    params.set(
      'keyword',
      keyword.trim()
    );
  }

  if (status) {
    params.set(
      'status',
      status
    );
  }

  return apiFetch<PageResponse<Brand>>(
    `${ENDPOINT}?${params.toString()}`
  );
}

// =====================================================
// GET SINGLE BRAND
// =====================================================

export async function getBrand(
  id: number
): Promise<Brand> {

  return apiFetch<Brand>(
    `${ENDPOINT}/${id}`
  );
}

// =====================================================
// CREATE
// =====================================================

export async function createBrand(
  data: BrandRequest,
  file: File | null
): Promise<Brand> {

  const formData = new FormData();

  formData.append(
    'request',
    new Blob(
      [JSON.stringify(data)],
      {
        type: 'application/json',
      }
    )
  );

  if (file) {
    formData.append(
      'file',
      file
    );
  }

  return apiFetch<Brand>(
    ENDPOINT,
    {
      method: 'POST',
      body: formData,
    }
  );
}

// =====================================================
// UPDATE
// =====================================================

export async function updateBrand(
  id: number,
  data: BrandRequest,
  file: File | null
): Promise<Brand> {

  const formData = new FormData();

  formData.append(
    'request',
    new Blob(
      [JSON.stringify(data)],
      {
        type: 'application/json',
      }
    )
  );

  if (file) {
    formData.append(
      'file',
      file
    );
  }

  return apiFetch<Brand>(
    `${ENDPOINT}/${id}`,
    {
      method: 'PUT',
      body: formData,
    }
  );
}

// =====================================================
// DELETE
// =====================================================

export async function deleteBrand(
  id: number
): Promise<void> {

  await apiFetch(
    `${ENDPOINT}/${id}`,
    {
      method: 'DELETE',
    }
  );
}