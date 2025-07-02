// lib/utils.ts
export function getImageUrl(url: string | undefined, fallbackText: string = "Producto"): string {
  // Si no hay URL o es la URL de test, usar placeholder simple
  if (!url || url === '/productos/test-image.jpg') {
    // Usando data URL con SVG para evitar problemas externos
    const text = fallbackText.substring(0, 10); // Limitar texto
    const svg = `<svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
      <rect width="400" height="400" fill="#f97316"/>
      <text x="200" y="200" font-family="Arial" font-size="24" fill="white" text-anchor="middle" dominant-baseline="middle">${text}</text>
    </svg>`;
    return `data:image/svg+xml;base64,${btoa(svg)}`;
  }
  
  return url;
}