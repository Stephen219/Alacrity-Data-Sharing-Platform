
// to avoid types being in the camponents  define them here

type User = {
  organizatio_id: string | string[] | undefined;
  followers_count: number;
  following_count: number;
  social_links: never[];


 
  date_joined: string;
  profile_picture: string;
  date_of_birth: string;
  bio: string;
  id: unknown;
  email: string;
  username: string; 
  firstname: string;
  lastname: string;
  phonenumber: string;
  organization: string | null;
  organization_id: string | null;
  role: string;
  field: string;
  
}





export type { User };

export type UserRole = "organization_admin" | "contributor" | "researcher" | null;