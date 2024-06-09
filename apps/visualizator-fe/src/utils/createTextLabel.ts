import { CanvasTexture, SpriteMaterial, Sprite, Vector3 } from 'three';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createTextLabel(text: any, position: any) {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  canvas.width = 256;
  canvas.height = 64;
  context!.fillStyle = '#FFFFFF';
  context!.font = '24px Arial';
  context!.fillText(text, canvas.width / 4, canvas.height / 2);

  const texture = new CanvasTexture(canvas);
  const material = new SpriteMaterial({ map: texture });
  const sprite = new Sprite(material);
  sprite.scale.set(2, 0.5, 1);
  sprite.position.copy(position.clone().add(new Vector3(0, 0.35, 0)));

  return sprite;
}
