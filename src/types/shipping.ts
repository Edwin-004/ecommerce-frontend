export interface DeliveryZone {
  zoneId: number;
  zoneName: string;
  regionOrState: string;
  township: string;
  currentFee: number;
  estimatedDays: string;
  status: 'ACTIVE' | 'INACTIVE';
}