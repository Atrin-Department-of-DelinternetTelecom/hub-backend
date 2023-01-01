this is a document for frontend devs

# Delinternet Documents
document is a pdf representation of an entity in database. it can be related to anything and contain any data.

## List of document types

- sepa (related to a client)
- data_protection (related to a client)
- alta_fix (related to a fix contract)
- alta_tv (related to a TV contract)
- alta_internet (related to an internet contract)
- cell_contract (related to a cell contract)
- cell_portability (related to a cell contract)
- change_holder (related to a contract)
- change_iban (related to a client)
- fix_portability (related to a fix contract)
- grant_permission (related to a client)
- installation_report (related to a contract)
- leave_request (related to a leave_request)
- material_delivery (related to a material_delivery)
- vacation (related to a vacation)


### Document detail fields
### alta_fix
```js
{
    contract: {
      id: number,
      reference: string,
      type: string,
    }
}
```

### alta_internet
```js
{
    contract: {
      id: number,
      reference: string,
      type: string,
    }
}
```

### alta_tv
```js
{
    contract: {
      id: number,
      reference: string,
      type: string,
    }
}
```

### cell_contract
```js
{
    contract: {
      id: number,
      reference: string,
      type: string,
    },
    number: string,
    uploadedToAire: boolean,
}
```

### cell_portability
```js
{
    contract: {
      id: number,
      reference: string,
      type: string,
    },
    number: string,
    uploadedToAire: boolean,
}
```


### change_holder
```js
{
    contract: {
      id: number,
      reference: string,
    },
    fromClient: {
      id: changeHolder.fromClient.id,
      name: changeHolder.fromClient.name,
    },
    toClient: {
      id: changeHolder.toClient.id,
      name: changeHolder.toClient.name,
    },
  }
```
