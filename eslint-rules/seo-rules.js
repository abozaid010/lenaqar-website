/**
 * Custom ESLint rules for SEO enforcement
 * Ensures all pages follow SEO best practices for LenaAI
 */

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Enforce SEO best practices',
      category: 'Best Practices',
    },
    messages: {
      missingMetadata: 'Page must export metadata with title, description, and openGraph',
      missingTitle: 'Metadata must include a title property',
      missingDescription: 'Metadata must include a description property',
      missingOpenGraph: 'Metadata must include openGraph property',
      missingCanonical: 'Metadata must include alternates.canonical URL',
      missingAltText: 'Image must have alt text describing AI-related value when relevant',
      duplicateTitle: 'Duplicate title detected. Each page must have a unique title',
      missingSemanticHTML: 'Use semantic HTML elements (header, nav, main, article, section, footer)',
    },
  },
  create(context) {
    let hasMetadataExport = false;
    let metadataNode = null;
    const titles = new Set();

    return {
      ExportNamedDeclaration(node) {
        // Check for metadata export
        if (node.declaration && node.declaration.type === 'VariableDeclaration') {
          node.declaration.declarations.forEach((decl) => {
            if (decl.id && decl.id.name === 'metadata') {
              hasMetadataExport = true;
              metadataNode = decl.init;
            }
          });
        }
      },
      'Program:exit'(node) {
        const filename = context.getFilename();
        // Skip non-page files
        if (!filename.includes('/page.jsx') && !filename.includes('/page.tsx') && !filename.includes('/layout.jsx') && !filename.includes('/layout.tsx')) {
          return;
        }

        // Skip API routes and error pages
        if (filename.includes('/api/') || filename.includes('/error.') || filename.includes('/loading.')) {
          return;
        }

        // Check if metadata exists
        if (!hasMetadataExport && !filename.includes('/layout.jsx') && !filename.includes('/layout.tsx')) {
          context.report({
            node,
            messageId: 'missingMetadata',
          });
          return;
        }

        if (metadataNode) {
          // Check for required properties
          const properties = metadataNode.properties || [];
          const hasTitle = properties.some((prop) => prop.key && prop.key.name === 'title');
          const hasDescription = properties.some((prop) => prop.key && prop.key.name === 'description');
          const hasOpenGraph = properties.some((prop) => prop.key && prop.key.name === 'openGraph');
          const hasAlternates = properties.some((prop) => prop.key && prop.key.name === 'alternates');

          if (!hasTitle) {
            context.report({
              node: metadataNode,
              messageId: 'missingTitle',
            });
          }

          if (!hasDescription) {
            context.report({
              node: metadataNode,
              messageId: 'missingDescription',
            });
          }

          if (!hasOpenGraph) {
            context.report({
              node: metadataNode,
              messageId: 'missingOpenGraph',
            });
          }

          if (!hasAlternates) {
            context.report({
              node: metadataNode,
              messageId: 'missingCanonical',
            });
          }
        }
      },
      JSXOpeningElement(node) {
        // Check for images without alt text
        if (node.name && node.name.name === 'img') {
          const altAttr = node.attributes.find(
            (attr) => attr.name && attr.name.name === 'alt'
          );
          if (!altAttr || (altAttr.value && altAttr.value.value === '')) {
            context.report({
              node,
              messageId: 'missingAltText',
            });
          }
        }

        // Check for Next.js Image component without alt
        if (node.name && node.name.name === 'Image') {
          const altAttr = node.attributes.find(
            (attr) => attr.name && attr.name.name === 'alt'
          );
          if (!altAttr || (altAttr.value && altAttr.value.value === '')) {
            context.report({
              node,
              messageId: 'missingAltText',
            });
          }
        }
      },
    };
  },
};

