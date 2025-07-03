export interface Talla {
  talla: string;
  cantidad: number;
  precio: number;
}

export interface Variacion {
  colores: string[];
  imagen_url: string;
  tallas: Talla[];
}

export interface Producto {
  id?: string;
  nombre: string;
  descripcion: string;
  categoria: string;
  subcategoria: string;
  variaciones: Variacion[];
  fecha_creacion?: Date;
  activo: boolean;
}

export interface ProductoForm {
  nombre: string;
  descripcion: string;
  categoria: string;
  subcategoria: string;
  variaciones: {
    colores: string[];
    imagen_file?: File;
    imagen_url?: string;
    tallas: Talla[];
  }[];
  activo: boolean;
}
