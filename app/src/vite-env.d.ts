/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

// CSS side-effect imports
declare module "*.css" {
  const content: Record<string, string>;
  export default content;
}

// Image modules
declare module "*.svg" {
  const content: string;
  export default content;
}

declare module "*.png" {
  const content: string;
  export default content;
}

declare module "*.webp" {
  const content: string;
  export default content;
}
