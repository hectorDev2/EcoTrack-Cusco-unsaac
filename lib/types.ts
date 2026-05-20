export interface Zone {
  id: string;
  name: string;
  description?: string;
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: 'CITIZEN' | 'DRIVER' | 'ADMIN';
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  zones: Zone[];
}

export interface UserStats {
  total: number;
  active: number;
  drivers: number;
  admins: number;
  citizens: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ApiError {
  message: string;
  statusCode: number;
  error?: string;
}
