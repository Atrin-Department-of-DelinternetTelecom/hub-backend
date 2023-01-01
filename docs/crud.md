### Defining Swagger Resources
By default swagger resources stored in `src/api/resources`. 
each resource is a class that extends crud `Resource` class.
so to define `Example` resource create a file named by `Example.js` in `src/api/resources` path and put the following into it.

```  
const Resource = require('@lib/crud/Resource'); 

module.exports = class Example extends Resource { 
    // 
}
```
now, go and refresh the Swagger and search the `examples`. Congratulation!! you created a CRUD API.

### Customize api path
The `uriKey` method of resources enables you to customize api path. by default this path string generates from the resource class name. you can customize it by overwrite this method like bellow:
```
    /**
     * Get the uri key.
     * 
     * @return string
     */
    uriKey() {  
        return 'my-custom-api-path';
    }
```
* use the following property on the resource to disable some routes:
index:  `configureIndexSwagger`
create: `configureCreateSwagger`
detail: `configureViewSwagger`
update: `configureUpdateSwagger`
delete: `configureDeleteSwagger`

### Fields
The field is a way to describe your `api`. Each resource contains a `fields` method. This method returns an array of fields, which generally extend the crud `Field` class. 

To add a field to a resource, you may simply add it to the resource's `fields` method. Typically, fields may be created using their new static method. This method accepts several arguments; however, you usually only need to pass the "human readable" name of the field. we will automatically "snake case" this string to determine the underlying database column:
```
const ID = require('@lib/crud/Fields/ID');




/**
 * Get the list of fields.
 * 
 * @return array
 */
fields() {
    return [
        new ID(),
    ];
}
```

### Showing / Hiding Fields
Often, you will only want to display a field in certain situations. For example, there is typically no need to show a `Password` field on a resource index listing. Likewise, you may wish to only display a `Creation Date` field on the creation / update forms. new CRUDs it a breeze to hide / show fields on certain pages.

The following methods may be used to show / hide fields based on the display context:

`hideWhenCreation`
`hideWhenUpdating`
`hideOnDetail`
`hideOnIndex`
`hideOnSwagger`
`hideOnSequelize`
`hideOnForms`

`onlyOnForms`
`exceptOnForms`
`onlyOnDetail`
`onlyOnIndex`
`onlyOnSwagger`
`onlyOnSequelize`

You may chain any of these methods onto your field's definition in order to instruct where the field should be displayed:

`new ID().hideWhenCreation()`

for now we have support the following fields. 
`Boolean`
`Date`
`DateTime`
`File`
`ID`
`Image`
`Number`
`Text`
`Textarea`
`UID`

### Swagger fields
Each fields contains a `swagger` method to help you customize Swagger definition of fields. for eaxmple `swagger('format', 'date-ttime')` add `format` to the swagger definition of field.

### Sequelize fields
Each fields contains a `sequelize` method to help you customize Sequelize definition of fields. for eaxmple `sequelize('type', 'enum')` change `type` attribute of sequelize definition.


### Scopes
Scopes is a way to get some thing from api by `get` method. each scope is a class that extends crud `Scope` class. to define scope `MyScope` create a file named by `MyScope.js` in `src/api/resources/scopes` path and put the following code into it.

```
const Scope = require('@lib/crud/Scope');  

module.exports = class MyScope extends Scope {
// 
}
```
the `scopes` method of each resource helps you to attach an scope to it. for example add the following code into the previously generated resource (`Example` resource):

```
const MyScope = require('./scopes/MyScope');



/**
 * Get the resource scopes.
 * 
 * @return array
 */
scopes() {
    return [
        new MyScope(),
    ];
}    
```

now, refresh the Swagger ui and serach `my-scopes`.
* Each scopes contains a `uriKey` like resources that enables you to change path of the scope api.
* Each scopes api called a `get{pluralize(ScopeName)}` method of the controller.(for this example calls `getMyScopes`)


### Actions
Actions enables you to post something to the server and get its result. each action is a class that extends crud `Action` class. to define `MyAction` action create a file named by `MyAction.js` in `src/api/resources/actions` path and put the following into it.

```
const Action = require('@lib/crud/Action');  

module.exports = class MyAction extends Action {
// 
}
```
now, the `actions` method of each resource helps you to attach an action to it. for example add the following code into the previously generated resource (`Example` resource):

```
const MyAction = require('./actions/MyAction');



/**
 * Get the resource actions.
 * 
 * @return array
 */
actions() {
    return [
        new MyAction(),
    ];
}    
```

Like resources, actions contains a `fields` method to attach some fields into it. for eaxmple add following code into created action attach id parameter to swagger config:
```
const ID = require('@lib/crud/Fields/ID');




/**
 * Get the list of fields.
 * 
 * @return array
 */
fields() {
    return [
        new ID(),
    ];
}
```

now, refresh the Swagger ui and serach `my-actions`.
* Each actions contains a `uriKey` like resources that enables you to change path of the action api.
* Each actions api called a `post{ActionName}` method of the controller.(for this example calls `postMyAction`)

### Inline actions
if you need to call an action for a specific resource id you should chain the `inline` after regsitering the action like following

```
const MyAction = require('./actions/MyAction');



/**
 * Get the resource actions.
 * 
 * @return array
 */
actions() {
    return [
        new MyAction()
            .inline(),
    ];
}    
```