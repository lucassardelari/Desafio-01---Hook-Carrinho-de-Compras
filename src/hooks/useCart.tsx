import { createContext, ReactNode, useContext, useState } from 'react';
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
    const storagedCart = localStorage.getItem('@RocketShoes:cart')
    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      let newCart = cart;
      let possuiProd = {} as Product;
      await api.get(`products/${productId}`).then(resp => {
        let product: Product = resp.data;
        possuiProd = newCart.find(item => item.id === productId) ?? {} as Product;
        console.log('teste', possuiProd)
        if (!possuiProd.id) {
          product.amount = 1;
          newCart.push(product);
          localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart))
          setCart([...newCart])
        }
      })

      if (possuiProd.id) {
        await api.get(`stock/${productId}`).then(resp => {
          let prodStock: Stock = resp.data;
          console.log('teste', prodStock,)
          if (possuiProd?.amount >= prodStock.amount) {
            toast.error('Quantidade solicitada fora de estoque');
            return;
          }
          else {
            newCart.map(item => item.id === productId ? { ...item, amount: item.amount++ } : item)
            localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart))
            setCart([...newCart])
          }
        });
      }


    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      let newCart = cart;
      let index = newCart.findIndex(item => item.id === productId);
      if (index > -1) {
        newCart.splice(index, 1)
      }
      else {
        throw new Error("");
      }


      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart))
      setCart([...newCart])
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      let newCart = cart;
      if (amount <= 0) {
        return;
      }
      await api.get(`stock/${productId}`).then(resp => {
        let prodStock: Stock = resp.data;
        if (amount >= prodStock.amount) {
          toast.error('Quantidade solicitada fora de estoque');
          return;
        }
        else {
          newCart = newCart.map(item => item.id === productId ? { ...item, amount: amount } : item)
          localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart))
          setCart([...newCart])
        }
      });

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

