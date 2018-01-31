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

      Object.keys(description).forEach(objName => {
        Object.keys(description[objName].components).forEach(compName => {
          //Setup de chaque composant de chaque objet de la scène
          //La fonction setup renvoie une promsesse qu'on stocke 
          //dans le tableau setupPromise.
          setupPromises.push(Scene.current.findObject(objName).getComponent(compName).setup(description[objName].components[compName]))
        });
        
        //Ensuite on regarde si les objets on des enfants, si oui
        //on setup ses composants
        Object.keys(description[objName].children).forEach(childName => {
          Object.keys(description[objName].children[childName].components).forEach(childCompName => {
            setupPromises.push((Scene.current.findObject(objName).getChild(childName) as IEntity).getComponent(childCompName).setup(description[objName].children[childName].components[childCompName]))
          });
        });
      });

      //Une fois que toutes les promesses sont résolues on retourne la scène actuelle
      Promise.all(setupPromises).then(function () {
        resolve(Scene.current);
      });
    });
  }

  private constructor(description: ISceneDesc) {
    //Pour chaque objet de la scène on créé une entitée
    //puis on ajoute chaque composants
    Object.keys(description).forEach(objName => {
      this.scenes[objName] = new Entity();
      Object.keys(description[objName].components).forEach(compName => {
        this.scenes[objName].addComponent(compName);
      })

      //Si l'objet a des enfants, on configure ses composants
      //puis on "ajoute" l'enfant au parent avec la fonction addChild
      Object.keys(description[objName].children).forEach(childName => {
        let myChild = new Entity();
        Object.keys(description[objName].children[childName].components).forEach(childCompName => {
          myChild.addComponent(childCompName);
        });
        this.scenes[objName].addChild(childName, myChild);
      });
    });
    //Si l'enfant à des enfants ... ¯\_(ツ)_/¯, j'aurais du faire une fonction récursive mais
  }

  // ## Fonction *findObject*
  // La fonction *findObject* retourne l'objet de la scène
  // portant le nom spécifié.
  findObject(objectName: string): IEntity {
    let foundObject;
    //Si l'objet n'est pas un enfant on peut y accéder directement
    if(this.scenes[objectName] instanceof Entity) {
      foundObject = this.scenes[objectName]
    } else {
      //Si pas trouvé dans les objet de la scène ça doit être un enfant
      //donc on parcours les objets de la scène en vérifiant leurs enfants
      for (let objName in this.scenes) {
        if(this.scenes[objName].getChild(objectName) instanceof Entity) foundObject = this.scenes[objName].getChild(objectName);
      }
    }
    return foundObject as IEntity;
  }

  // ## Méthode *walk*
  // Cette méthode parcourt l'ensemble des entités de la
  // scène et appelle la fonction `fn` pour chacun, afin
  // d'implémenter le patron de conception [visiteur](https://fr.wikipedia.org/wiki/Visiteur_(patron_de_conception)).
  walk(fn: ISceneWalker): Promise<any> {
    let promises = new Array();

    //Pour chaque objet de la scène on applique la fonction fn à ses enfant
    //grâce à la fonction walkChildren
    //puis on lui applique la fonction fn
    return new Promise<Scene>((resolve, reject) => {
      for (let objName in this.scenes) {
        promises.push(new Promise((resolve, reject) => {
          this.scenes[objName].walkChildren(fn);
          fn(this.scenes[objName], objName).then(() => {
            resolve()
          });
        }));
      }

      //Une fois que la fonction fn est fini pour tous les objets 
      //on peut sortir
      Promise.all(promises).then(function () {
        resolve();
      });
    });
  }
}
