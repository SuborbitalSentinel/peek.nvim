// PlantUML Server API client
// Uses PlantUML's simpler hex encoding with ~h prefix

import type { DiagramRenderer } from './diagram-renderer.ts';

class PlantUML implements DiagramRenderer {
  // Use the official PlantUML demo server
  private readonly serverUrl = 'https://www.plantuml.com/plantuml';

  // Convert text to hex encoding (simpler than deflate)
  private encodeHex(text: string): string {
    const encoder = new TextEncoder();
    const bytes = encoder.encode(text);
    let hex = '';
    for (const byte of bytes) {
      hex += byte.toString(16).padStart(2, '0');
    }
    return hex;
  }

  async render(id: string, content: string, container: Element): Promise<string | null> {
    try {
      // Check if dark mode is active
      const isDarkMode = document.body.getAttribute('data-theme') === 'dark';

      // Add dark theme to PlantUML content if in dark mode and no theme is specified
      let themedContent = content;
      if (isDarkMode && !content.includes('!theme ')) {
        // Insert dark theme directive after @start line
        themedContent = content.replace(
          /(@start\w+.*?\n)/,
          '$1!theme cyborg-outline\n'
        );
      }

      // Use hex encoding with ~h prefix - much simpler than deflate
      const hexEncoded = this.encodeHex(themedContent);
      const imageUrl = `${this.serverUrl}/svg/~h${hexEncoded}`;

      // Return an img element with the PlantUML server URL
      return `<img src="${imageUrl}" alt="PlantUML Diagram" style="max-width: 100%;" />`;
    } catch (error) {
      console.error('PlantUML render error:', error);

      // Fallback: show the PlantUML source with a link to the web editor
      const encodedForUrl = encodeURIComponent(content);
      return `
        <div style="padding: 10px; background: #f8f8f8; border: 1px solid #ddd; border-radius: 5px;">
          <p style="color: #666; margin: 0 0 10px 0;">PlantUML Diagram (click to render online):</p>
          <pre style="background: white; padding: 10px; border-radius: 3px; overflow-x: auto; margin: 0 0 10px 0;">
${content}
          </pre>
          <a href="http://www.plantuml.com/plantuml/uml/${encodedForUrl}" target="_blank" style="color: #0066cc; text-decoration: underline;">
            Open in PlantUML Editor
          </a>
        </div>
      `;
    }
  }
}

export default new PlantUML();