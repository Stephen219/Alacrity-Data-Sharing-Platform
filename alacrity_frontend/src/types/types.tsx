
// to avoid types being in the camponents  define them here

type User = {
  id: number;
  email: string;
  username: string;
  firstname: string;
  lastname: string;
  phonenumber: string;
  organization: string | null;
  role: string;
  field: string;
}


export type { User };