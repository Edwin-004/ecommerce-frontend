// ၁။ Table တွင် ပြသရန် (ZoneGroupResponse DTO နှင့် ကိုက်ညီသည်)
export interface DeliveryZoneGroup {
  zoneIds: number[];
  zoneCode: string;
  zoneName: string;
  regionOrState: string;
  city: string;
  townships: string[];
  isCityDefault: boolean;
  shippingFee: number;
  estimatedDays: number;
  status: 'ACTIVE' | 'INACTIVE';  
}

// ၂။ Zone အသစ်ဆောက်ရန် (CreateZoneGroupRequest DTO နှင့် ကိုက်ညီသည်)
export interface CreateZoneGroupRequest {
  zoneName: string;
  zoneCode?: string;
  regionOrState: string;
  city: string;
  townships: string[];
  shippingFee: number;
  estimatedDays: number;
  hasDefaultRate ?: boolean;
  defaultShippingFee ?: number;
  defaultEstimatedDays ?: number;
}

// ၃။ ဈေးနှုန်းနှင့် Status ပြင်ဆင်ရန် (UpdateZoneRateRequest DTO နှင့် ကိုက်ညီသည်)
export interface UpdateZoneRateRequest {
  zoneIds: number[];
  zoneName?: string;
  shippingFee: number;
  estimatedDays: number;
  status?: 'ACTIVE' | 'INACTIVE';
}

export interface LocationRegion {
  regionOrState: string;
  city: string;
  townships: string[];
}