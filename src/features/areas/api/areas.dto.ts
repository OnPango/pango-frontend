/** Bodies of the department endpoints (`docs/stock-requests.md` in pango-core). */

/** `GET /departments`, `GET /departments/:id` and the answers of `POST` / `PATCH`. */
export interface DepartmentDto {
  id: number;
  name: string;
  costCenter: string | null;
  isActive: boolean;
  userCount: number;
}

export interface DepartmentBodyDto {
  name?: string;
  costCenter?: string | null;
  isActive?: boolean;
}
