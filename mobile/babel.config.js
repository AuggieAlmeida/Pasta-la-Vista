module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      'react-native-reanimated/plugin',
      function () {
        return {
          name: 'transform-import-meta-env',
          visitor: {
            MemberExpression(path) {
              // Verifica se é import.meta.env
              if (
                path.node.object.type === 'MetaProperty' &&
                path.node.object.meta.name === 'import' &&
                path.node.object.property.name === 'meta' &&
                path.node.property.name === 'env'
              ) {
                path.replaceWith({
                  type: 'MemberExpression',
                  object: {
                    type: 'Identifier',
                    name: 'process'
                  },
                  property: {
                    type: 'Identifier',
                    name: 'env'
                  }
                });
              }
            }
          }
        };
      }
    ],
  };
};
