// @flow

import {Map, fromJS, Iterable, List} from 'immutable';
import {GraphQLList,
    GraphQLFloat,
    GraphQLScalarType,
    GraphQLObjectType,
    GraphQLString,
    GraphQLOutputType,
    GraphQLFieldConfig,
    GraphQLInt,
    GraphQLFieldConfigMap,
    GraphQLInputObjectType,
    GraphQLFieldConfigMapThunk} from 'graphql';

const GeneralType =  new GraphQLScalarType({
    name: 'GeneralType',
    serialize: (value) => value,
    parseValue: (value) => value,
    parseLiteral: (ast) => ast.value
});

const imMath = require('immutable-math');

const INT_TYPE_NAME = 'Int';
const FLOAT_TYPE_NAME = 'Float';
const STRING_TYPE_NAME = 'String';



/**
 * A list that has an associated group of keys,
 * @param {GraphQLOutputType} type that the keyed list is based on
 * @returns a GraphQLObjectType that is specific for the graphql object type being aggregated.
 */

// Because there is no way other then other then returning a
// GraphQLScalarType to have key value pairs, and then
// we have no way of adding more aggregations

var keyedAggregationType = {};
export function KeyedListAggregation(type: GraphQLOutputType): GraphQLObjectType{
    if(!keyedAggregationType[type.name]){
        keyedAggregationType[type.name] = new GraphQLObjectType({
            name: `${type.name}AggregationKeyedList`,
            fields: () => ({
                key : {
                    type: GraphQLString,
                    description: `Key after aggregation`,
                     resolve: (obj) => obj.key
                },
                aggregate: {
                    type: new AggregationType(type),
                    description:   `Further aggregaion ${type.name}`,
                    resolve: (obj) => {
                        return obj.value
                    }
                },
                values: {
                    type: new GraphQLList(type),
                    description:   `Values after aggregation ${type.name}`,
                    resolve: (obj) => {
                        return obj.value
                    } 
                }
            })
        });
    }
    return keyedAggregationType[type.name]
}

var keyedListTypes = {};
export function KeyedList(type: GraphQLOutputType): GraphQLObjectType{
    if(!keyedListTypes[type.name]){
        keyedListTypes[type.name] = new GraphQLObjectType({
            name: `${type.name}KeyedList`,
            fields: () => ({
                asMap : {
                    type: GeneralType,
                    description: `Return an unstructed map`,
                    resolve: (obj) => obj
                }, 
                keys : {
                    type: new GraphQLList(GraphQLString),
                    description: `Keys after aggregation`,
                     resolve: (obj) => Map(obj)
                        .keySeq()
                        .toArray()
                },
                values: {
                    type: new GraphQLList(AggregationType(type)),
                    description:   `Values after aggregation ${type.name}`,
                    resolve: (obj) => {
                        return Map(obj)
                            .valueSeq()
                            .toArray()
                    }
                },
                keyValue: {
                    type: new GraphQLList(KeyedListAggregation(type)),
                    description: `Key-Values after aggregation ${type.name}`,
                    resolve: (obj) => {
                        return Map(obj).reduce((rr, value, key) => {
                            return rr.push({
                                    key: key,
                                    value: value
                                })
                        }, List()).toArray()
                    }
                }
            })
        });
    }
    return keyedListTypes[type.name]
}


 
/*
* Checks if a Map<GraphQLFieldConfig> from a graphql schema is a float
* @params {Map} field immutable map from GraphQLFieldConfig
* @returns {boolean} true if the field is a Float (GraphQLFloat)
*/

export function isFloat(field: Map<string, *>): boolean {
    return field.get('type').name === FLOAT_TYPE_NAME
}

/*
* Checks if a Map<GraphQLFieldConfig> from a graphql schema is a int
* @params {Map} field immutable map from GraphQLFieldConfig
* @returns {boolean} true if the field is a Int (GraphQLInt)
*/
export function isInt(field: Map<string, *>): boolean {
    return field.get('type').name === INT_TYPE_NAME
}

/*
* Checks if a Map<GraphQLFieldConfig> from a graphql schema is a string
* Checks if a Map from a graphql schema is a string
* @returns {boolean} true if the field is a String (GraphQLString)
*/

export function isString(field: Map<string, *>): boolean {
    return field.get('type').name === STRING_TYPE_NAME
}

/**
 * Resolves fields using custom resolver or reverts to using obj.key
 */

var fieldResolver = (field, key) => (args, ctx, root) => (obj) => {
    return field.get('resolve', (obj)=> obj[key])(obj, args, ctx, root)
}

//fieldResolver resolver for the type that we are creating the filds for.
function createFields(type: GraphQLOutputType,
        returnType: GraphQLOutputType, 
        resolver: (fieldResolver: * , key: string, obj: *, field: Map<string,*>) => GraphQLFieldConfig,
        typeCheck: (field: GraphQLFieldConfig) => boolean
    ): GraphQLFieldConfigMap {

    let fields = type._typeConfig.fields()

    return fromJS(fields)
        .reduce((resultFields: Map<string,*>, field: Map<string,*>, key: string): Map<string, GraphQLFieldConfig> => {
            if(typeCheck(field)){
                return resultFields.set(key, Map({
                    type: returnType,
                    resolve: (obj, args, ctx, root): GraphQLFieldConfig => {
                        return resolver(fieldResolver(field, key)(args, ctx, root), key, obj, field) 
                    }
                }))
            }
            return resultFields;
        }, Map()).toJS();
}

function createFieldsFromFieldList(fields, returnType: GraphQLOutputType, resolver: (fieldResolver: * , key: string, obj: *, field: Map<string,*>) => GraphQLFieldConfig ){
        return fromJS(fields)
            .reduce((resultFields: Map<string,*>, field: Map<string,*>, key: string): Map<string, GraphQLFieldConfig> => {
                return resultFields.set(key, Map({
                    type: returnType,
                    resolve: (obj, args, ctx, root): GraphQLFieldConfig => {
                        return resolver(fieldResolver(field, key)(args, ctx, root), key, obj, field)
                    }
                }))
            }, Map()).toJS();
}


const FilterIntOperations = new GraphQLInputObjectType({
    name: "FilterIntOperations",
    description: 'Filter operations for int',
    fields : () =>  filterIntArgs
})


var filterIntArgs = {
    gt: {
        type: GraphQLInt,
        description: 'Filter only values greater then value.'
    },
    lt: {
        type: GraphQLInt,
        description: 'Filter only values less then value.' 
    },
    gte: {
        type: GraphQLInt,
        description: 'Filter only values greater then or equal to value' 
    }, 
    lte: {
        type: GraphQLInt,
        description: 'Filter only values less then or equal to value' 
    }, 
    equal: {
        type: GraphQLInt,
        description: 'Filter only values equal to value.' 
    }, 
    not: {
        type: FilterIntOperations,
        description: 'Filter only values equal to value.' 
    }, 
    or: {
        type: new GraphQLList(FilterIntOperations),
        description: 'Filter only values equal to value.'
    }
}


const FilterStringOperations = new GraphQLInputObjectType({
    name: "FilterStringOperations",
    description: 'Filter operations for strings',
    fields : () =>  filterStringArgs
})


var filterStringArgs = {
    gt: {
        type: GraphQLString,
        description: 'Filter only values greater then value.'
    },
    lt: {
        type: GraphQLString,
        description: 'Filter only values less then value.' 
    },
    gte: {
        type: GraphQLString,
        description: 'Filter only values greater then or equal to value' 
    }, 
    lte: {
        type: GraphQLString,
        description: 'Filter only values less then or equal to value' 
    }, 
    equal: {
        type: GraphQLString,
        description: 'Filter only values equal to value.' 
    }, 
    not: {
        type: FilterStringOperations,
        description: 'Filter only values equal to value.' 
    }, 
    or: {
        type: new GraphQLList(FilterStringOperations),
        description: 'Filter only values equal to value.'
    }
}


const filterFunctions = (field, key) => ({
    gt: ({gt}, value: number ): boolean => {
        return gt == null || gt < value;
    },
    lt: ({lt}, value: number ): boolean => {
        return lt == null || lt > value;
    },
    gte: ({gte}, value: number ): boolean => {
        return gte == null || gte <= value;
    },
    lte: ({lte}, value: number ): boolean => {
        return lte == null || lte >= value;
    },
    equal: ({equal}, value: number ): boolean => {
        return equal == null || equal === value;
    },
    not: ({not}, value: *, obj: *): boolean => {
        return not == null || !runFilterFunction(field, key)(not, obj)
    },
    // or:  ({or}, value: number): boolean => {
    //     return true //or != null && //runFilterFunction(not, value)
    // }

})

var runFilterFunction = (field, key) => (args, ii, ctx, root ) => {
    let {gt, lt, gte, lte, equal, not} = filterFunctions(field, key);
    let resolver = fieldResolver(field, key);

    return gt(args, resolver({}, ctx, root)(ii)) 
            && lt(args, resolver({}, ctx, root)(ii)) 
            && gte(args, resolver({}, ctx, root)(ii)) 
            && lte(args, resolver({}, ctx, root)(ii)) 
            && equal(args, resolver({}, ctx, root)(ii)) 
            && not(args, resolver({}, ctx, root)(ii), ii) 
    //&& filterFunctions.or(args, field.get('resolve')(ii));
}

var resolveIntFilter = (field, key) => (obj, args, ctx, root) => {
    return List(obj).filter(ii => runFilterFunction(field, key)(args, ii, ctx, root))
}

function filterFieldConfigFactory(fields, field: Map<string, *>, key: string, type: GraphQLObjectType): GraphQLFieldConfig{
    if(isInt(field)){
        return fields.set(key, Map({
            type: AggregationType(type),
            args: filterIntArgs,
            resolve: resolveIntFilter(field, key),
            description: `Filters ${key} via args.`
        }))
    }
    if(isString(field)){
        return fields.set(key, Map({
            type: AggregationType(type),
            args: filterStringArgs,
            resolve: resolveIntFilter(field, key),
            description: `Filters ${key} via args.`
        }))
    }
    return fields;
}

function containsType(fields, typeCheck) {
    return fromJS(fields)
}

/**
 * Creates an AggregationType with it based on the GraphQLOutputType requested,
 * Objects that wish to be resolved this way must be a Array of the requested type.
 * 
 * @param {GraphQLOutputType} type - type to create the aggregaion functions for
 */


var aggregationTypes = {};
export function AggregationType(type: GraphQLObjectType): GraphQLObjectType {
    if(!aggregationTypes[type.name]){
        aggregationTypes[type.name] = new GraphQLObjectType({
            name: `${type.name}Aggregation`,
            description: `Preform aggregation methods on ${type.name}`,
            fields: (): GraphQLFieldConfigMap => {
                let typeFields = fromJS(type._typeConfig.fields())
                let intFields = typeFields.filter(field => isFloat(field) || isInt(field))
                let stringFields = typeFields.filter(field => isString(field))

                let fields = Map(
                    {
                        values : {
                            description: `List of ${type.name}`,
                            type: new GraphQLList(type),
                            resolve: (obj: Array<*>|List<*>): GraphQLList<*> => {
                                return List(obj).toArray()
                            }
                        },
                        count : {
                            description: 'The amount of items in the aggregaion',
                            type: GraphQLInt,
                            resolve: (obj: Array<*>): number => List(obj).count()

                        },
                        first: {
                            description: 'Return the first item in the aggregaion',
                            type: type,
                            resolve: (obj: Array<*>): * => List(obj).first()
                        },
                        last: {
                            description: 'Return the last item in the aggregaion',
                            type: type,
                            resolve: (obj: Array<*>): * =>  List(obj).last()
                        },
                        reverse: {
                            description: 'Reverse the order of the items in the aggregaion',
                            type: AggregationType(type),
                            resolve: (obj: Array<*>): * => List(obj).reverse()
                        },
                        //slice: {}
                        // sort: {
                        //     description: 'Sort the list via the parameter',
                        //     fields: () =>
                        //         createFields(type, 
                        //             AggregationType(type),
                        //             (fieldResolver: * , key: string, obj: *) => {
                        //                 return fromJS(obj).sort((a, b) => {
                        //                     return fieldResolver(a) > fieldResolver(b)
                        //                 })
                        //             }, 
                        //             () => true)
                        // },
                        //flattern
                        //flattern should allow a CSV to be generated.
                        groupedBy : {
                            type: new GraphQLObjectType({
                                name: `${type.name}GroupedByAggregation`,
                                description: `Preform groupBy aggregation methods on ${type.name}`,
                                fields: () => {

                                    return createFields(type, 
                                        KeyedList(type), 
                                        (fieldResolver: * , key: string, obj: *) => {
                                            return List(obj).groupBy(fieldResolver).map(ii => ii.toArray())
                                        }, 
                                        () => true 
                                    )
                                }
                            }),
                            description: `Group items in aggregaion by the value of a field.`,
                            resolve: (obj) => obj
                        },

                    })                    
                if(stringFields.count() > 0 || intFields.count() > 0){
                    fields = fields.set('filter',
                        {
                            description: `Preform filter aggregation methods on ${type.name}`,
                            type: new GraphQLObjectType({
                                name: `${type.name}FilterAggregation`,
                                description: `Preform filter aggregation methods on ${type.name}`,
                                args: filterIntArgs,
                                fields: () => {
                                    return fromJS(type._typeConfig.fields())
                                        .reduce((fields, typeField, key) => {
                                            return filterFieldConfigFactory(fields, typeField, key, type)
                                        }, Map()).toJS()
                                }
                            }),
                            resolve: (obj) => obj
                        })
                    if(intFields.count() > 0){
                        // add integer operations
                        return fields.merge(Map(
                            {
                            sum: { 
                                description: `Sum the values of a field on ${type.name}`,
                                type: new GraphQLObjectType({
                                    name: `${type.name}Sum`,
                                    description: `Perform sum on ${type.name}`,
                                    fields: () => {
                                        return createFieldsFromFieldList(intFields, 
                                            GraphQLFloat, 
                                            (fieldResolver: * , key: string, obj: *) => {
                                                return List(obj).update(imMath.sumBy(fieldResolver))
                                            }, 
                                            (field) => isFloat(field) || isInt(field))
                                    }
                                }),
                                resolve: (obj) => obj
                            },
                            average: {
                                description: `Returns the average of a field on ${type.name}`,
                                type: new GraphQLObjectType({
                                    name: `${type.name}Average`,
                                    description: `Perform averages on ${type.name}`,
                                    fields: () => {
                                        return createFieldsFromFieldList(intFields, 
                                            GraphQLFloat, 
                                            (fieldResolver: * , key: string, obj: *) => {
                                                return List(obj).update(imMath.averageBy(fieldResolver))
                                            }, 
                                            (field) => isFloat(field) || isInt(field))
                                    }
                                }),
                                resolve: (obj) => obj
                            },
                            median: {
                                description: `Returns the median value of a field on ${type.name}`,
                                type: new GraphQLObjectType({
                                    name: `${type.name}Median`,
                                    description: `Perform median calculation on ${type.name}`,
                                    fields: () => {
                                        return createFieldsFromFieldList(intFields, 
                                            GraphQLFloat, 
                                            (fieldResolver: * , key: string, obj: *) => {
                                                return List(obj).update(imMath.medianBy(fieldResolver))
                                            }, 
                                            (field) => isFloat(field) || isInt(field))
                                    }
                                }),
                                resolve: (obj) => obj  
                            },
                            min: {
                                description: `Returns the minium value of all the items on a field on ${type.name}`,
                                type: new GraphQLObjectType({
                                    name: `${type.name}Min`,
                                    description: `minium on value of a field for ${type.name}`,
                                    fields: () => {
                                        return createFieldsFromFieldList(intFields, 
                                            GraphQLFloat, 
                                            (fieldResolver: * , key: string, obj: *) => {
                                                return List(obj).update(imMath.minBy(fieldResolver))
                                            }, 
                                            (field) => isFloat(field) || isInt(field))
                                    }
                                }),
                                resolve: (obj) => obj
                            },
                            max: {
                                description: `Returns the maximum value of all the items on a field on${type.name}`,
                                type: new GraphQLObjectType({
                                    name: `${type.name}Max`,
                                    description: `maximum on value of a field for ${type.name}`,
                                    fields: () => {
                                        return createFieldsFromFieldList(intFields, 
                                            GraphQLFloat, 
                                            (fieldResolver: * , key: string, obj: *) => {
                                                return List(obj).update(imMath.maxBy(fieldResolver))
                                            }, 
                                            (field) => isFloat(field) || isInt(field))
                                    }
                                }),
                                resolve: (obj) => obj
                            }
                        })).toObject()
                    }
                }
                return fields.toObject();
            }

        })
    }
    return aggregationTypes[type.name];
}
