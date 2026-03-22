export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  arModelUrl?: string;
  tags: string[];
  stock: number;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  role: 'user' | 'admin';
  createdAt: string;
}

export interface Order {
  id: string;
  userId: string;
  items: { productId: string; quantity: number; name: string; price: number }[];
  totalAmount: number;
  status: 'pending' | 'paid' | 'shipped' | 'delivered';
  paymentId?: string;
  createdAt: string;
}
