const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Soporte para monorepo (npm workspaces): @obraya/shared vive fisicamente en
// packages/shared (symlink en node_modules). Se mapea puntualmente en vez de
// agregar todo el node_modules raiz a la resolucion, para no exponer
// versiones de react/react-native hoisteadas para otros workspaces (backend,
// frontend) que difieren de las que usa mobile (React 18.2 / RN 0.73) y
// rompen las Rules of Hooks al convivir dos copias de React.
config.watchFolders = [workspaceRoot];
config.resolver.extraNodeModules = {
  '@obraya/shared': path.resolve(workspaceRoot, 'packages/shared'),
};

// `expo` trae su propia copia interna de react/react-native/metro (para su
// tooling de CLI/dev-server), incompatible con las versiones del proyecto.
config.resolver.blockList = [/node_modules\/expo\/node_modules\/.*/];

// Fuerza react/react-native a resolver siempre contra la copia real de
// packages/mobile, sin importar desde que archivo se pida (incluye codigo
// dentro de symlinks como @obraya/shared). Evita "Invalid hook call" por
// convivencia de dos copias de React (la del monorepo raiz, para
// frontend/backend, vs la de mobile). Se delega en el resolver default de
// Metro (entiende extensiones por plataforma, .ios.js, etc.) pero anclando
// el origen de busqueda dentro de packages/mobile/node_modules.
const pinnedOrigin = path.resolve(projectRoot, 'node_modules/.pin/pin.js');
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'react' || moduleName === 'react-native' ||
      moduleName.startsWith('react/') || moduleName.startsWith('react-native/')) {
    return context.resolveRequest(
      { ...context, originModulePath: pinnedOrigin },
      moduleName,
      platform,
    );
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
