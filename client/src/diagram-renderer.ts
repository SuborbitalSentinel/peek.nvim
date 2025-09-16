// Common diagram rendering utilities

export interface DiagramRenderer {
  render(id: string, content: string, container: Element): Promise<string | null>;
}

export type DiagramType = 'mermaid' | 'plantuml';

export interface DiagramConfig {
  type: DiagramType;
  containerClass: string;
  dataAttribute: string;
  selector: string;
  contentExtractor: (el: Element) => string | null;
  hasRendered: (el: Element) => boolean;
}

export const DIAGRAM_CONFIGS: Record<DiagramType, DiagramConfig> = {
  mermaid: {
    type: 'mermaid',
    containerClass: 'peek-mermaid-container',
    dataAttribute: 'data-graph-definition',
    selector: 'div[data-graph="mermaid"]',
    contentExtractor: (el) => el.getAttribute('data-graph-definition'),
    hasRendered: (el) => !!el.querySelector('svg'),
  },
  plantuml: {
    type: 'plantuml',
    containerClass: 'peek-plantuml-container',
    dataAttribute: 'data-plantuml-content',
    selector: 'div[data-graph="plantuml"]',
    contentExtractor: (el) => el.getAttribute('data-plantuml-content'),
    hasRendered: (el) => !!el.querySelector('img'),
  },
};

export function createDiagramRenderer(
  renderer: DiagramRenderer,
  config: DiagramConfig,
  parser: DOMParser,
) {
  async function render(el: Element) {
    const content = config.contentExtractor(el);
    if (!content) return;

    try {
      const html = await renderer.render(`${el.id}-render`, content, el);

      if (html) {
        // Remove the loader
        const loader = el.querySelector('.peek-loader');
        if (loader) loader.remove();

        // Parse and append the rendered content
        const renderedElement = parser.parseFromString(html, 'text/html').body;
        el.appendChild(renderedElement);

        // Adjust container height
        const height = config.type === 'mermaid'
          ? window.getComputedStyle(renderedElement).getPropertyValue('height')
          : 'auto';

        el.parentElement?.style.setProperty('height', height);
      }
    } catch (error) {
      console.error(`${config.type} render error:`, error);

      // Remove loader and show error
      const loader = el.querySelector('.peek-loader');
      if (loader) loader.remove();

      const errorDiv = document.createElement('div');
      errorDiv.className = 'diagram-error';
      errorDiv.textContent = `Failed to render ${config.type} diagram`;
      el.appendChild(errorDiv);
    }
  }

  return () => {
    const elements = Array.from(
      document.querySelectorAll(config.selector)
    ).filter((el) => !config.hasRendered(el));

    elements.forEach(render);
  };
}