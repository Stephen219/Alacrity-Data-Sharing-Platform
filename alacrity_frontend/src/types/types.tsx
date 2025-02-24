
// to avoid types being in the camponents  define them here
type User = {
  id: string;
  name: string;
  email: string;
  phone_number: string;
  role: "organisation" | "researcher" | "contributor";
  field: string;


};

export type { User };