export type RequestStatus = 'New' | 'InProgress' | 'Completed' | 'Cancelled';
export type RequestType   = 'General' | 'Legal' | 'Payment' | 'Appeal';
export type SortField     = 'CreatedAt' | 'RequestNumber' | 'Status' | 'RequestType';

export interface RequestDto {
  id:               number;
  requestNumber:    string;
  customerId:       number;
  ownerId:          number;
  assignedToUserId: number | null;
  status:           RequestStatus;
  requestType:      RequestType;
  createdAt:        string; // ISO string
}

export interface PagedResult<T> {
  items:      T[];
  totalCount: number;
  page:       number;
  pageSize:   number;
  totalPages: number;
}

export interface SearchParams {
  requestNumber:  string;
  statuses:       RequestStatus[];
  dateFrom:       string;
  dateTo:         string;
  requestType:    RequestType | '';
  sortBy:         SortField;
  sortDescending: boolean;
  page:           number;
  pageSize:       number;
}
