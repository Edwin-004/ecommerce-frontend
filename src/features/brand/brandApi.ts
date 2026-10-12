
import { apiFetch } from '../../utils/api';

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

  // Brand -> Categories
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

  // Selected category IDs
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
// ENDPOINT
// =====================================================

const ENDPOINT =
  '/api/backoffice/brands';

// =====================================================
// GET BRANDS
// SEARCH + STATUS + PAGINATION
// =====================================================

export async function getBrands(
  page = 0,
  size = 10,
  keyword = '',
  status: BrandStatus | '' = '',
  sortBy = 'brandName',
  sortDir: 'asc' | 'desc' = 'asc'
): Promise<PageResponse<Brand>> {

  const params =
    new URLSearchParams();

  params.set(
    'page',
    String(page)
  );

  params.set(
    'size',
    String(size)
  );

  // Spring Data format:
  // sort=columnName,direction

  params.set(
    'sort',
    `${sortBy},${sortDir}`
  );

  const trimmedKeyword =
    keyword.trim();

  if (trimmedKeyword) {

    params.set(
      'keyword',
      trimmedKeyword
    );
  }

  if (status) {

    params.set(
      'status',
      status
    );
  }

  const url =
    `${ENDPOINT}?${params.toString()}`;

  console.log(
    'GET BRANDS:',
    url
  );

  return apiFetch<
    PageResponse<Brand>
  >(url);
}

// =====================================================
// CREATE BRAND
// =====================================================

export async function createBrand(
  data: BrandRequest,
  file: File | null
): Promise<Brand> {

  const formData =
    new FormData();

  // Backend:
  // @RequestPart("request")

  formData.append(
    'request',
    new Blob(
      [
        JSON.stringify(data),
      ],
      {
        type: 'application/json',
      }
    )
  );

  // Backend:
  // @RequestPart(
  //     value = "file",
  //     required = false
  // )

  if (file) {

    formData.append(
      'file',
      file
    );
  }

  console.log(
    'CREATE BRAND REQUEST:',
    data
  );

  return apiFetch<Brand>(
    ENDPOINT,
    {
      method: 'POST',
      body: formData,
    }
  );
}

// =====================================================
// UPDATE BRAND
// =====================================================

export async function updateBrand(
  brandId: number,
  data: BrandRequest,
  file: File | null
): Promise<Brand> {

  const formData =
    new FormData();

  formData.append(
    'request',
    new Blob(
      [
        JSON.stringify(data),
      ],
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

  console.log(
    'UPDATE BRAND:',
    brandId,
    data
  );

  return apiFetch<Brand>(
    `${ENDPOINT}/${brandId}`,
    {
      method: 'PUT',
      body: formData,
    }
  );
}

