import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
     const storagedCart = localStorage.getItem('@RocketShoes:cart'); //Buscar dados do localStorage

     // if null return [], if not return:
     if (storagedCart) {
       return JSON.parse(storagedCart); // Transform string in array of Product
     }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      // Find the product based on your Id
      const updatedCart = [...cart];
      const productExists = updatedCart.find(
        response => response.id === productId
      );

      const stock = await api.get(`/stock/${productId}`); // search the products in the stock
      const stockAmount = stock.data.amount; // get the amount of a specific product in the stock

      const currentAmount = productExists ? productExists.amount : 0; // get the amount of a specific product in the cart, if not exists product in the cart, then is equal to zero
      const amount = currentAmount + 1;

      if(amount > stockAmount) {
        toast.error('Quantidade solicitada fora de estoque');

        return
      }
      
      if(productExists) { // If exists product in the cart add 1 more
        productExists.amount = amount;
      } else { // Else add product in the cart
        const product = await api.get(`/products/${productId}`);

        const newProduct = {
          ...product.data,
          amount: 1
        }
        updatedCart.push(newProduct);
      }

      setCart(updatedCart);

      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart));

      return

    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const updatedCart = [...cart];
      const ProductIndex = updatedCart.findIndex(
        response => response.id === productId
      );

      if (ProductIndex >= 0) {
        updatedCart.splice(ProductIndex, 1); // remove the product finded
        
        setCart(updatedCart)

        localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart));
      } else{
          throw Error();
      }

      return

    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if (amount <= 0){
        return;
      }

      const stock = await api.get(`/stock/${productId}`);
      const stockAmount = stock.data.amount;

      if (amount > stockAmount) {
        toast.error('Quantidade solicitada fora de estoque');

        return;
      }

      const updatedCart = [...cart];
      const productExists = updatedCart.find(response => response.id === productId);

      if (productExists) {
        productExists.amount = amount;

        setCart(updatedCart)

        localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart));
      } else {
        throw Error();
      }

    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
