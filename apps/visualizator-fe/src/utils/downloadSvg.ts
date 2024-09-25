const containerElements = ['svg', 'g'];
const relevantStyles: Record<string, string[]> = {
  rect: ['fill', 'stroke', 'stroke-width'],
  path: ['fill', 'stroke', 'stroke-width'],
  circle: ['fill', 'stroke', 'stroke-width'],
  line: ['stroke', 'stroke-width'],
  text: ['fill', 'font-size', 'text-anchor'],
  polygon: ['stroke', 'fill']
};

const readElement = (parentNode: Element, origData: Element) => {
  const children = parentNode.childNodes;
  const originalChildren = origData.childNodes;
  for (let i = 0; i < children.length; i++) {
    const Child = children[i] as Element;
    const tagName = Child.tagName;
    if (containerElements.indexOf(tagName) !== -1) {
      readElement(Child, originalChildren[i] as Element);
    } else if (tagName in relevantStyles) {
      const style = window.getComputedStyle(originalChildren[i] as Element);
      let styleStr = '';
      for (let st = 0; st < relevantStyles[tagName].length; st++) {
        styleStr +=
          relevantStyles[tagName][st] +
          ':' +
          style.getPropertyValue(relevantStyles[tagName][st]) +
          '; ';
      }
      Child.setAttribute('style', styleStr);
    }
  }
};

const downloadSvg = (el: HTMLDivElement, padding = 10) => {
  const svgElement = el.querySelector('svg');

  if (!svgElement) {
    alert('No SVG chart found');
    return;
  }

  const clonedSvg = svgElement.cloneNode(true) as SVGElement;
  readElement(clonedSvg, svgElement);

  const width = parseFloat(clonedSvg.getAttribute('width') || '0');
  const height = parseFloat(clonedSvg.getAttribute('height') || '0');
  const viewBox = clonedSvg.getAttribute('viewBox')?.split(' ').map(Number) || [
    0,
    0,
    width,
    height
  ];

  const paddedViewBox = [
    viewBox[0] - padding,
    viewBox[1] - padding,
    viewBox[2] + 2 * padding,
    viewBox[3] + 2 * padding
  ];

  clonedSvg.setAttribute('viewBox', paddedViewBox.join(' '));

  clonedSvg.setAttribute('width', `${width + 2 * padding}`);
  clonedSvg.setAttribute('height', `${height + 2 * padding}`);

  const svgString = new XMLSerializer().serializeToString(clonedSvg);
  const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });

  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'chart.svg';
  link.click();
};

export default downloadSvg;
