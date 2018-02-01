import { IEntity, Entity } from './entity';
import { IComponent } from './components';

// # Interface *ISceneWalker*
// Définit le prototype de fonction permettant d'implémenter
// le patron de conception [visiteur](https://fr.wikipedia.org/wiki/Visiteur_(patron_de_conception))
// sur les différentes entités de la scène.
export interface ISceneWalker {
  (entity: IEntity, name: string): Promise<any>;
}

// # Interfaces de description
// Ces interfaces permettent de définir la structure de
// description d'une scène, telle que normalement chargée
// depuis un fichier JSON.
export interface IComponentDesc {
  [key: string]: any;
}

export interface IEntityDesc {
  components: IComponentDesc;
  children: ISceneDesc;
}

export interface ISceneDesc {
  [key: string]: IEntityDesc;
}

// # Classe *Scene*
// La classe *Scene* représente la hiérarchie d'objets contenus
// simultanément dans la logique du jeu.
export class Scene {
  static current: Scene;
  scenes: { [name: string]: IEntity; } = { };


  // ## Fonction statique *create*
  // La fonction *create* permet de créer une nouvelle instance
  // de la classe *Scene*, contenant tous les objets instanciés
  // et configurés. Le paramètre `description` comprend la
  // description de la hiérarchie et ses paramètres. La fonction
  // retourne une promesse résolue lorsque l'ensemble de la
  // hiérarchie est configurée correctement.
  static create(description: ISceneDesc): Promise<Scene> {
    //Tableau qui contiendra les promesses sur les setups des composants
    let setupPromises = new Array();

    return new Promise<Scene>((resolve, reject) => {
      const scene = new Scene(description);
      Scene.current = scene;

      for(let obj in description) {
        for(let comp in description[obj].components) {
          //On setup les composants de l'objets
          setupPromises.push(Scene.current.findObject(obj).getComponent(comp).setup(description[obj].components[comp]));
        }

        for(let child in description[obj].children) {
          //Puis on setup récursivement ses enfants
          setupPromises.push(Scene.current.setupChildrenRecurse(Scene.current.findObject(obj).getChild(child) as Entity, description[obj].children[child]));
        }
      }
      //Une fois que toutes les promesses sont résolues on retourne la scène actuelle
      Promise.all(setupPromises).then(function () {
        resolve(Scene.current);
      });
    });
  }

  //Setup récusif des enfants qui retourne une promesse résolue quand terminée
  setupChildrenRecurse(child: Entity, desc: IEntityDesc): Promise<any> {
    let setupPromises = new Array();
    return new Promise<any>((resolve, reject) => {
      for(let comp in desc.components) {
        child.getComponent(comp).setup(desc.components[comp]);
      }
      
      for(let childOfChild in child.children) {
        this.setupChildrenRecurse(child.getChild(childOfChild) as Entity, desc.children[childOfChild])
      }

      Promise.all(setupPromises).then(function () {
        resolve();
      });
    });

  }


  private constructor(description: ISceneDesc) {
    for(let obj in description) {
      this.scenes[obj] = new Entity();
      for(let comp in description[obj].components) {
        this.scenes[obj].addComponent(comp);
      }
      //Fonction récursive pour créer les enfants
      for(let child in description[obj].children) {
        this.scenes[obj].addChild(child, this.construChildrenRecurse(description[obj].children[child]))
      }
    }

  }


  //Construit récursivement les enfants
  construChildrenRecurse(ent: IEntityDesc): IEntity {
    let entity = new Entity();
    for(let comp in ent.components) {
      entity.addComponent(comp);
    }

    for(let child in ent.children) {
      entity.addChild(child, this.construChildrenRecurse(ent.children[child]));
    }

    return entity;
  }




  // ## Fonction *findObject*
  // La fonction *findObject* retourne l'objet de la scène
  // portant le nom spécifié.
  findObject(objectName: string): IEntity {
    let foundObject;

    //Si l'objet n'est pas un enfant on peut y accéder directement
    if(this.scenes[objectName] != undefined) {
      return this.scenes[objectName];
    } else {
      //Sinon on le cherche récursivement dans les enfants des objets, puis leurs enfants etc ...
      for (let obj in this.scenes) {
        foundObject = this.findRecurse(objectName, this.scenes[obj] as Entity)
        if (foundObject != undefined) {
          return foundObject;
        }
      }
      throw new Error("Did not find the object " + objectName);
    }
  }

  //Pour une entitée donnée on parcours récursivement ses enfants
  findRecurse(objectName:string, ent:Entity): IEntity | undefined {
    let foundObject;
    foundObject = ent.getChild(objectName);
    if(foundObject != undefined) {
      return foundObject;
    } else {
      for(let child in ent.children) {
        foundObject = this.findRecurse(objectName, ent.children[child] as Entity)
        if(foundObject != undefined) {
          return foundObject;
        }
      }
    }
  }

  // ## Méthode *walk*
  // Cette méthode parcourt l'ensemble des entités de la
  // scène et appelle la fonction `fn` pour chacun, afin
  // d'implémenter le patron de conception [visiteur](https://fr.wikipedia.org/wiki/Visiteur_(patron_de_conception)).
  walk(fn: ISceneWalker): Promise<any> {
    let promises = new Array();

    return new Promise<Scene>((resolve, reject) => {
      for (let obj in this.scenes) {
        promises.push(new Promise((resolve, reject) => {
          //On parcours les objets de la scène et on y applique la fonction fn
          fn(this.scenes[obj], obj).then(() => {
            resolve()
          });
          //Ensuite on parcours récursivement les enfants de chaque objets pour y appliquer la fonction fn
          //Je n'utilise pas la fonction walkchildren
          for(let child in (this.scenes[obj] as Entity).children) {
            this.walkChildrenRecurse((this.scenes[obj] as Entity).children[child], fn, child).then(() => {
              resolve()
            });
          }
        }));
      }

      //Une fois que la fonction fn est fini pour tous les objets 
      //on peut sortir
      Promise.all(promises).then(function () {
        resolve();
      });
    });
  }

  //Fonction récursive pour parcourir les enfants et y appliquer la fonction fn
  //On renvoie une promesse résolue quand la fonction est terminée
  walkChildrenRecurse(children: IEntity, fn: ISceneWalker, name: string ): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      fn(children, name).then(() => {
        resolve()
      });
      for(let child in (children as Entity).children) {
        this.walkChildrenRecurse((children as Entity).children[child], fn, child)
      }
    });
  }
}
