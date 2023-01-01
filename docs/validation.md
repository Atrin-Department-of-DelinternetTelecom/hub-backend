
# *Swagger Validation Error Documents*       

## Possible Errors

- **OBJECT_MISSING_REQUIRED_PROPERTY**

- **INVALID_FORMAT**
<br />
For example, email format is not observed.

- **INVALID_TYPE**

- **PATTERN**
<br />
If custom pattern is not observed.

- **ENUM_MISMATCH**

- **MIN_LENGTH**

- **MAX_LENGTH**


## Response Format

- **JSON Parameters**
<br />
"code" - status code (400)
<br />
"payload":&nbsp;&nbsp;{
    <br />
    &nbsp; &nbsp; &nbsp; &nbsp; "code":&nbsp;&nbsp;status code (400),
    <br />
    &nbsp; &nbsp; &nbsp; &nbsp; "message":&nbsp;&nbsp;A sentence that describes the errors that occurred in detail,
    <br />
    &nbsp; &nbsp; &nbsp; &nbsp; "errors": &nbsp;&nbsp;{
        "field name": [
                "errors occured"
            ],
    }
    <br />
    &nbsp; &nbsp; &nbsp; &nbsp; "meta": {}
    <br />
}

- **Example**
<br />
{
<br />"code": 400,
<br />
"payload":&nbsp;&nbsp;{
    <br />
    &nbsp; &nbsp; &nbsp; &nbsp; "code": 400,
    <br />
    &nbsp; &nbsp; &nbsp; &nbsp; "message": "type of gift is invalid! minimum length of name is invalid! format of email is invalid!",
    <br />
    &nbsp; &nbsp; &nbsp; &nbsp; "errors": {
            <br />&nbsp; &nbsp; &nbsp; &nbsp;&nbsp; &nbsp; &nbsp; &nbsp;"gift": [
                "INVALID_TYPE"
            ],
            <br />&nbsp; &nbsp; &nbsp; &nbsp;&nbsp; &nbsp; &nbsp; &nbsp;"email": [
                "INVALID_FORMAT"
            ],
            <br />&nbsp; &nbsp; &nbsp; &nbsp;&nbsp; &nbsp; &nbsp; &nbsp;"name": [
                "MIN_LENGTH"
            ]
        <br />&nbsp; &nbsp; &nbsp; &nbsp;},
    <br />
    &nbsp; &nbsp; &nbsp; &nbsp; "meta": {}
    <br />
}
