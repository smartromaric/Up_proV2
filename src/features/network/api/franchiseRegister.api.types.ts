/** Réponse POST /v1/auth/franchise/register (Swagger § 02 - Auth). */
export interface ApiFranchiseRegisterResponse {
  status?: string;
  role?: string;
  userType?: string;
  franchiseId?: string;
  member?: {
    id?: string;
    franchise_id?: string;
    user_id?: string;
    role?: string;
    active?: boolean;
  };
  profile?: {
    id?: string;
    email?: string;
    first_name?: string;
    last_name?: string;
    display_name?: string;
    city_id?: string;
  };
  session?: {
    access_token?: string;
    refresh_token?: string;
  };
  error?: {
    code?: string;
    message?: string;
  };
}

export interface ApiFranchiseRegisterPayload {
  email: string;
  password: string;
  phone?: string;
  firstName: string;
  lastName: string;
  cityId: string;
  franchiseId: string;
  franchiseName?: string;
  devBypass?: boolean;
}
