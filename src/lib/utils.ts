export function getImageUrl(url: string | undefined, fallbackText: string = "Producto"): string {
  if (!url || url === '/productos/test-image.jpg') {
    return getPlaceholderSvg(fallbackText);
  }
  
  return url;
}

export function getPlaceholderSvg(fallbackText: string = "Producto"): string {
  const text = fallbackText.substring(0, 10); // Limitar texto
  const svg = `<svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
    <rect width="400" height="400" fill="#f97316"/>
    <text x="200" y="200" font-family="Arial" font-size="24" fill="white" text-anchor="middle" dominant-baseline="middle">${text}</text>
  </svg>`;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

export function handleImageError(e: React.SyntheticEvent<HTMLImageElement>, fallbackText: string = "Producto"): void {
  const target = e.target as HTMLImageElement;
  if (target.src.startsWith('data:image/svg+xml')) {
    return;
  }
  target.src = getPlaceholderSvg(fallbackText);
}

export function isLocalProductImage(url: string | undefined): boolean {
  return url?.startsWith('/productos/') || false;
}