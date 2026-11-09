/** A department (área): it requests stock from the warehouses (CU-08). */
export interface Department {
  id: string;
  name: string;
  /** Accounting reference, optional. */
  costCenter: string | null;
  /** False: inactive; its people cannot create requests until they get another area. */
  isActive: boolean;
  /** People that belong to it. */
  userCount: number;
}

export type DepartmentStatusFilter = 'active' | 'inactive' | 'all';

export interface DepartmentInput {
  name: string;
  costCenter: string | null;
}

/** `PATCH /departments/:id`: only what changed; `isActive` deactivates or reactivates it. */
export type UpdateDepartmentInput = Partial<DepartmentInput> & { isActive?: boolean };
