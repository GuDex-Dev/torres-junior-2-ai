import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  getDoc, 
  updateDoc, 
  deleteDoc,
  query,
  orderBy,
  where
} from 'firebase/firestore';
import { db, COLLECTIONS } from './firebase';
import { Producto } from '../types/producto';

export async function crearProducto(producto: Omit<Producto, 'id' | 'fecha_creacion'>): Promise<string> {
  try {
    const productoConFecha = {
      ...producto,
      fecha_creacion: new Date(),
    };
    
    const docRef = await addDoc(collection(db, COLLECTIONS.PRODUCTOS), productoConFecha);
    console.log('Producto creado con ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error creando producto:', error);
    throw new Error('Error al crear el producto');
  }
}

export async function obtenerProductos(): Promise<Producto[]> {
  try {
    const q = query(
      collection(db, COLLECTIONS.PRODUCTOS), 
      orderBy('fecha_creacion', 'desc')
    );
    const querySnapshot = await getDocs(q);
    
    const productos: Producto[] = [];
    querySnapshot.forEach((doc) => {
      productos.push({
        id: doc.id,
        ...doc.data()
      } as Producto);
    });
    
    return productos;
  } catch (error) {
    console.error('Error obteniendo productos:', error);
    throw new Error('Error al obtener productos');
  }
}

export async function obtenerProductoPorId(id: string): Promise<Producto | null> {
  try {
    const docRef = doc(db, COLLECTIONS.PRODUCTOS, id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      } as Producto;
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error obteniendo producto:', error);
    throw new Error('Error al obtener el producto');
  }
}

export async function actualizarProducto(id: string, producto: Partial<Producto>): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.PRODUCTOS, id);
    await updateDoc(docRef, producto);
    console.log('Producto actualizado:', id);
  } catch (error) {
    console.error('Error actualizando producto:', error);
    throw new Error('Error al actualizar el producto');
  }
}

export async function eliminarProducto(id: string): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.PRODUCTOS, id);
    await deleteDoc(docRef);
    console.log('Producto eliminado:', id);
  } catch (error) {
    console.error('Error eliminando producto:', error);
    throw new Error('Error al eliminar el producto');
  }
}

export async function buscarProductosPorCategoria(categoria: string): Promise<Producto[]> {
  try {
    const q = query(
      collection(db, COLLECTIONS.PRODUCTOS),
      where('categoria', '==', categoria),
      where('activo', '==', true)
    );
    const querySnapshot = await getDocs(q);
    
    const productos: Producto[] = [];
    querySnapshot.forEach((doc) => {
      productos.push({
        id: doc.id,
        ...doc.data()
      } as Producto);
    });
    
    return productos;
  } catch (error) {
    console.error('Error buscando productos por categoría:', error);
    throw new Error('Error al buscar productos');
  }
}