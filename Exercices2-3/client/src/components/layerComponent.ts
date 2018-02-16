import { Component } from './component';
import { SpriteComponent } from './spriteComponent';
import { IDisplayComponent } from '../displaySystem';
import { TextureComponent } from './textureComponent';
import { IEntity } from '../entity';
import { Entity } from '../entity';
import * as GraphicsAPI from '../graphicsAPI';

let GL: WebGLRenderingContext;

// # Classe *LayerComponent*
// Ce composant représente un ensemble de sprites qui
// doivent normalement être considérées comme étant sur un
// même plan.
export class LayerComponent extends Component<Object> implements IDisplayComponent {
  // ## Méthode *display*
  // La méthode *display* est appelée une fois par itération
  // de la boucle de jeu.
  private vertexBuffer: WebGLBuffer;
  private indexBuffer: WebGLBuffer;
  private allvertices: Float32Array;

  setup(){
    GL = GraphicsAPI.context;
    this.indexBuffer = GL.createBuffer()!;
    this.vertexBuffer = GL.createBuffer()!;
  }

  display(dT: number) {
    const layerSprites = this.listSprites();
    if (layerSprites.length === 0) {
      return;
    }
    const spriteSheet = layerSprites[0].spriteSheet;

    this.allvertices = new Float32Array(4 * TextureComponent.vertexSize * layerSprites.length);
    const allindices = new Uint16Array(6 * layerSprites.length);
    var i = 0;
    layerSprites.forEach(element => {
      this.allvertices.set(element.vertices, 20 * i);
      const indicesCalculated = new Uint16Array([0 + (i*4), 1 + (i*4), 2 + (i*4), 2 + (i*4), 3 + (i*4), 0 + (i*4)]);
      allindices.set(indicesCalculated, 6 * i);
      i++;
    });

    GL.bindBuffer(GL.ARRAY_BUFFER, this.vertexBuffer);
    GL.bufferData(GL.ARRAY_BUFFER, this.allvertices, GL.DYNAMIC_DRAW);
    GL.bindBuffer(GL.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
    GL.bufferData(GL.ELEMENT_ARRAY_BUFFER, allindices, GL.DYNAMIC_DRAW);
    spriteSheet.bind();
    GL.drawElements(GL.TRIANGLES, 6 * layerSprites.length, GL.UNSIGNED_SHORT, 0);
    spriteSheet.unbind();
  }

  // ## Fonction *listSprites*
  // Cette fonction retourne une liste comportant l'ensemble
  // des sprites de l'objet courant et de ses enfants.
  private listSprites() {
    const sprites: SpriteComponent[] = [];
    this.owner.walkChildren((child) => {
      this.listSpritesRecur(sprites, this.owner);
    });
    return sprites;
  }

  //On a besoin de faire une fonction récursive pour aller chercher les sprites
  //des enfants des enfants des enfant etc... Sinon on a un problème et la
  //layer HUD n'est pas affichée
  private listSpritesRecur(sprites: SpriteComponent[], entity: IEntity ){
    entity.walkChildren((child) => {
      if (!child.active)
        return;

      child.walkComponent((comp) => {
        if (comp instanceof SpriteComponent && comp.enabled)
          sprites.push(comp);
      });
      sprites = this.listSpritesRecur(sprites, child);
    });
    return sprites;
  }
}
