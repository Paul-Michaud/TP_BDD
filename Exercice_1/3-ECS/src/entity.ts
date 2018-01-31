import { IComponent, ComponentFactory } from './components';

export interface IEntityWalker {
  (entity: IEntity, name: string): Promise<any> | void;
}

export interface IComponentWalker {
  (comp: IComponent, type: string): Promise<any> | void;
}

// # Interface *IEntity*
// Cette interface présente la structure d'une entité valide
export interface IEntity {
  addChild(name: string, child: IEntity): void;
  getChild(name: string): IEntity | undefined;
  addComponent(type: string): IComponent;
  getComponent<T extends IComponent>(type: string): T;
  walkChildren(fn: IEntityWalker): void;
  walkComponent(fn: IComponentWalker): void;
}

// # Classe *Entity*
// La classe *Entity* représente un objet de la scène qui
// peut contenir des enfants et des composants.
export class Entity implements IEntity {
  // ## Fonction *componentCreator*
  // Référence vers la fonction permettant de créer de
  // nouveaux composants. Permet ainsi de substituer
  // cette fonction afin de réaliser des tests unitaires.
  static componentCreator = ComponentFactory.create;
  
  //Tableau pour contenir tous les composants de cette entitée
  components = new Array();
  //Tableau pour contenir les enfants de cette entitée
  children: { [name: string]: IEntity; } = { };
  

  // ## Méthode *addComponent*
  // Cette méthode prend en paramètre le type d'un composant et
  // instancie un nouveau composant.
  addComponent(type: string): IComponent {
    const newComponent = Entity.componentCreator(type, this);
    this.components.push(newComponent);
    return newComponent;
  }

  // ## Fonction *getComponent*
  // Cette fonction retourne un composant existant du type spécifié
  // associé à l'objet.
  getComponent<T extends IComponent>(type: string): T {
    let foundComp;
    foundComp = this.components[0]; //ugly but otherwise it causes an error for foundComp (used before assignated)
    //On itère jusqu'à trouver le composant du bon type
    this.components.forEach(component => {
      if(component.__type==type) foundComp = component;
    });
    return foundComp;
  }


  // ## Méthode *addChild*
  // La méthode *addChild* ajoute à l'objet courant un objet
  // enfant.
  addChild(objectName: string, child: IEntity) {
    this.children[objectName] = child;
  }

  // ## Fonction *getChild*
  // La fonction *getChild* retourne un objet existant portant le
  // nom spécifié, dont l'objet courant est le parent.
  getChild(objectName: string): IEntity | undefined {
    return this.children[objectName];
  }

  // ## Méthode *walkChildren*
  // Cette méthode parcourt l'ensemble des enfants de cette
  // entité et appelle la fonction `fn` pour chacun, afin
  // d'implémenter le patron de conception [visiteur](https://fr.wikipedia.org/wiki/Visiteur_(patron_de_conception)).
  walkChildren(fn: IEntityWalker): void {
    for (let key in this.children) {
      fn(this.children[key], key);
    }
  }

  // ## Méthode *walkComponent*
  // Cette méthode parcourt l'ensemble des composants de cette
  // entité et appelle la fonction `fn` pour chacun, afin
  // d'implémenter le patron de conception [visiteur](https://fr.wikipedia.org/wiki/Visiteur_(patron_de_conception)).
  walkComponent(fn: IComponentWalker): void {
    this.components.forEach(comp => {
      fn(comp, comp.__type);      
    });
  }
}
