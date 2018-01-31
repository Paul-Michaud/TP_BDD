"use strict";
exports.__esModule = true;
var entity_1 = require("../src/entity");
// # Composant de test *TestComponent*
// On définit ici un *[mock object](https://fr.wikipedia.org/wiki/Mock_%28programmation_orient%C3%A9e_objet%29)*
// qui permet de tester les réactions de nos objets de scène
// avec les composants, sans avoir besoin d'avoir des composants
// réels.
var TestComponent = /** @class */ (function () {
    // ## Constructeur de la classe *TestComponent*
    // Le constructeur conserve le type demandé et une référence
    // vers l'objet qui l'a créé dans ses attributs. Il appelle
    // ensuite la méthode statique `onCreate` avec une référence
    // à lui-même
    function TestComponent(__type, owner) {
        this.__type = __type;
        this.owner = owner;
        TestComponent.onCreate(this);
    }
    // ## Méthodes du composant
    // Chaque méthode du composant appelle la méthode statique
    // correspondant en passant une référence à lui-même,
    // en plus des paramètres au besoin.
    TestComponent.prototype.setup = function (descr) {
        return TestComponent.onSetup(this, descr);
    };
    // ## Pointeurs de méthodes statiques
    // Ces méthodes statiques n'ont aucun comportement par défaut
    // et, par la nature de JavaScript, pourront être remplacées
    // par des méthodes au besoin des tests.
    // Elles seront appelées lors des différentes actions sur les
    // composants de test afin d'en récupérer de l'information.
    TestComponent.onCreate = function () { };
    TestComponent.onSetup = function () { };
    return TestComponent;
}());
exports.TestComponent = TestComponent;
function create(type, owner) {
    return new TestComponent(type, owner);
}
function registerMock() {
    entity_1.Entity.componentCreator = create;
}
exports.registerMock = registerMock;
