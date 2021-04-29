class Validator {
  constructor() {
    this._errors = [];
    this._hendlers = new Map([
      ['array', (schema, dataToValidate) => {
        this.addErrorItemsCountMoreThanCanBe(schema, dataToValidate)
        this.addErrorItemsCountLessThanCanBe(schema, dataToValidate)
        this.addErrorMustContainAValueButDoesNot(schema, dataToValidate)
        this.addErrorElementsOfArrayNotUnique(schema, dataToValidate)
        this.addErrorTheEnumDoesNotSupportOneOfArrayElements(schema, dataToValidate)
        if (schema.items) dataToValidate.forEach(element => this.addErrorTypeIsIncorrect(schema.items, element))
      }],
      ['boolean', (schema, dataToValidate) => {'no individual handler'}],
      ['object', (schema, dataToValidate) => {
        this.addErrorTooManyPropertiesInObject(schema, dataToValidate)
        this.addErrorTooFewPropertiesInObject(schema, dataToValidate)
        this.addErrorPropertyRequiredButValueIsUndefined(schema, dataToValidate)
        this.addErrorAnObjectCantHaveAdditionalProperties(schema, dataToValidate)
        if (schema.properties) {
          for (let key in schema.properties) {
            this.addErrorTypeIsIncorrect(schema.properties[key], dataToValidate[key])
            
            if (schema.properties[key].items && this.getType(dataToValidate[key]) == 'array') {
              for (let el of dataToValidate[key]) {
                this.addErrorTypeIsIncorrect(schema.properties[key].items, el)
              }
            }
          }
        }
      }],
      ['number', (schema, dataToValidate) => {
        this.addErrorTheEnumDoesNotSupportValue(schema, dataToValidate)
        this.addErrorValueIsGreaterThanItCanBe(schema, dataToValidate)
        this.addErrorValueIsLessThanItCanBe(schema, dataToValidate)
      }],
      ['string', (schema, dataToValidate) => {
        this.addErrorTooLongString(schema, dataToValidate)
        this.addErrorTooShortString(schema, dataToValidate)
        this.addErrorStringDoesNotMatchPattern(schema, dataToValidate)
        this.addErrorTheEnumDoesNotSupportValue(schema, dataToValidate)
        this.addErrorFormatOfStringIsNotValid(schema, dataToValidate)
      }]
    ])
  }

  get Errors() {
    return this._errors;
  }

  /**
   *
   * @param schema
   * @param dataToValidate
   * @returns {boolean}
   */

  getType(data) {
    if (data.constructor === Array) return 'array'
    return typeof(data)
  }

  isType(schema, dataToValidate) {
    if (schema.type === this.getType(dataToValidate)) return true
    return false
  }

  //----Add error to _errors----//
  addErrorUnknownType(schema) {
    if (!this._hendlers.get(schema.type)) this._errors.unshift('Unknown type')
  }

  addErrorValueIsNullButNullableFalse(schema, dataToValidate) {
    if (schema.nullable === false && dataToValidate === null) this._errors.unshift('Value is null, but nullable false')
  }

  addErrorTypeIsIncorrect(schema, dataToValidate) {
    if (schema.nullable || schema.nullable === false) return
    if (schema.constructor === Array) {
      for (let item of schema) {
        if(this.isType(item, dataToValidate)) return
      }
    }
    if (!this.isType(schema, dataToValidate)) this._errors.unshift('Type is incorrect')
  }

  addErrorNoneSchemasAreValid(schema, dataToValidate) {
    for (let element of schema){
      if (this.isType(element, dataToValidate)) return
    }
    this._errors.unshift('None schemas are valid')
  }

  addErrorMoreThanOneShemaValidForThisData(schema, dataToValidate) {
    let isSchema = false
    for (let element of schema){
      if (this.isType(element, dataToValidate) && isSchema){
        this._errors.unshift('More than one shema valid for this data')
        return
      }
      if (this.isType(element, dataToValidate)) isSchema = true
    }
  }

  addErrorTheEnumDoesNotSupportValue(schema, dataToValidate) {
    const schemaEnum = schema.enum
    if (!schemaEnum) return
    if (schemaEnum.find(item => item === dataToValidate)) return
    this._errors.unshift('The enum does not support value')
  }

  addErrorValueIsGreaterThanItCanBe(schema, dataToValidate) {
    const schemaMaximum = schema.maximum
    if (!schemaMaximum) return
    if (schemaMaximum < dataToValidate) this._errors.unshift('Value is greater than it can be')
  }

  addErrorValueIsLessThanItCanBe(schema, dataToValidate) {
    const schemaMinimum = schema.minimum
    if (!schemaMinimum) return
    if (schemaMinimum > dataToValidate) this._errors.unshift('Value is less than it can be')
  }

  addErrorTooLongString(schema, dataToValidate) {
    const maxLength = schema.maxLength
    if (!maxLength) return
    if (dataToValidate.length > maxLength) this._errors.unshift('Too long string')
  }

  addErrorTooShortString(schema, dataToValidate) {
    const minLength = schema.minLength
    if (!minLength) return
    if (dataToValidate.length < minLength) this._errors.unshift('Too short string')
  }
  
  addErrorStringDoesNotMatchPattern(schema, dataToValidate) {
    const pattern = schema.pattern
    if (!pattern) return
    if (!pattern.test(dataToValidate)) this._errors.unshift('String does not match pattern')
  }

  addErrorFormatOfStringIsNotValid(schema, dataToValidate) {
    const format = schema.format
    if (!format) return
    const patternData = /\d{4}-\d{2}-\d{2}$/
    const patternEmail = /[a-z]@[a-z].[a-z]/
    if ((format === 'date' && !patternData.test(dataToValidate)) || (format === 'email' && !patternEmail.test(dataToValidate))) 
      this._errors.unshift('Format of string is not valid')
  }

  addErrorItemsCountMoreThanCanBe(schema, dataToValidate) {
    const maxItems = schema.maxItems
    if (!maxItems) return
    if (dataToValidate.length > maxItems) this._errors.unshift('Items count more than can be')
  }

  addErrorItemsCountLessThanCanBe(schema, dataToValidate) {
    const minItems = schema.minItems
    if (!minItems) return
    if (dataToValidate.length < minItems) this._errors.unshift('Items count less than can be')
  }

  addErrorMustContainAValueButDoesNot(schema, dataToValidate) {
    const contains = schema.contains
    if (!contains) return
    if (!dataToValidate.find(element => element === contains)) this._errors.unshift('Must contain a value, but does not')
  }

  addErrorElementsOfArrayNotUnique(schema, dataToValidate) {
    const uniqueItems = schema.uniqueItems
    if (!uniqueItems) return
    const set = new Set()
    dataToValidate.forEach(element => {
      set.add(JSON.stringify(element))
    })
    if (dataToValidate.length > set.size) {
      this._errors.unshift('Elements of array not unique')
    }
  }

  addErrorTheEnumDoesNotSupportOneOfArrayElements(schema, dataToValidate) {
    const enumSchema = schema.enum
    if (!enumSchema) return
    for (let element of enumSchema) {
      if (JSON.stringify(element) === JSON.stringify(dataToValidate)) return
    }
    this._errors.unshift('The enum does not support one of array elements')
  }

  addErrorTooManyPropertiesInObject(schema, dataToValidate) {
    const maxProperties = schema.maxProperties
    if (!maxProperties) return
    const lenProperties = Object.keys(dataToValidate).length
    if(maxProperties < lenProperties) this._errors.unshift('Too many properties in object')
  }

  addErrorTooFewPropertiesInObject(schema, dataToValidate) {
    const minProperties = schema.minProperties
    if (!minProperties) return
    const lenProperties = Object.keys(dataToValidate).length
    if(minProperties > lenProperties) this._errors.unshift('Too few properties in object')
  }

  addErrorPropertyRequiredButValueIsUndefined(schema, dataToValidate) {
    const required = schema.required
    if (!required) return
    required.forEach(requiredItem => {
      if(!dataToValidate[requiredItem])this._errors[0] = 'Property required, but value is undefined'
    })
  }

  addErrorAnObjectCantHaveAdditionalProperties(schema, dataToValidate) {
    const additionalProperties = schema.additionalProperties
    const properties = schema.properties
    if (!properties) return
    if (additionalProperties === false) {
      const shemaLen = Object.keys(properties).length
      const dataLen = Object.keys(dataToValidate).length
      if (shemaLen !== dataLen) {
        this._errors.unshift('An object cant have additional properties')
      }
    }
  }
  //---------------------------//

  isValid(schema = {}, dataToValidate) {
    
    const schemaVarinant = schema.anyOf || schema.oneOf
    if(schemaVarinant) this.addErrorNoneSchemasAreValid(schemaVarinant, dataToValidate)
    if(schema.oneOf) this.addErrorMoreThanOneShemaValidForThisData(schema.oneOf, dataToValidate)

    if (schema.type) {
      const hendler = this._hendlers.get(schema.type)
      this.addErrorTypeIsIncorrect(schema, dataToValidate)
      this.addErrorUnknownType(schema)
      this.addErrorValueIsNullButNullableFalse(schema, dataToValidate)
      if (hendler) hendler(schema, dataToValidate)
    }

    if (this._errors[0]) return false
    return true
  }

}
