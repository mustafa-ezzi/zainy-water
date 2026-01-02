export const area_list = [
  { id: "1", name: "Area A" },
  { id: "2", name: "Area B" },
  { id: "3", name: "Area C" },
  { id: "4", name: "Area D" },
];

export const sector_list = [
  { id: "1", name: "Building A" },
  { id: "2", name: "Building B" },
  { id: "3", name: "Building C" },
  { id: "4", name: "Building D" },
];

export type Customer = {
  id: string;
  customer_id: string;
  name: string;
  address: string;
  phone: string;
  bottle_price: number;
  balance: number;
  createdAt: Date;
  updatedAt: Date;
}

export const customer: Customer = {
  id: "1",
  customer_id: "abcd",
  name: "John Doe",
  address: "123 Main St, City, Country",
  phone: "123-456-7890",
  bottle_price: 100,
  balance: 500,
  createdAt: new Date("2023-01-01T00:00:00Z"),
  updatedAt: new Date("2023-01-02T00:00:00Z"),
}