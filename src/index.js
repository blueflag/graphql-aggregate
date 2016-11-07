// @flow

import {Map,fromJS} from 'immutable';
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

var keyedListTypes = {};
export function KeyedList(type: GraphQLOutputType): GraphQLObjectType{
    if(!keyedListTypes[type.name]){
        keyedListTypes[type.name] = new GraphQLObjectType({
            name: `${type.name}KeyedList`,
            fields: () => ({
                asMap : {
                    type: GeneralType,
                    description: `Return an unstructed map`,
                    resolve: (obj) => obj.toJS()
                }, 
                keys : {
                    type: new GraphQLList(GraphQLString),
                    description: `Keys after aggregation`,
                    resolve: (obj) => obj
                        .keySeq()
                        .toJS()
                },
                values: {
                    type: new GraphQLList(AggregationType(type)),
                    description:   `Values after aggregation ${type.name}`,
                    resolve: (obj) => {
                        return obj
                            .valueSeq()
                            .toJS()
                    }
                }
            })
        });
    }
    return keyedListTypes[type.name]
}


/*
* Checks if a Map<GraphQLFieldConfig> from a graphql schema is a float
* @private
* @params {Map} field immutable map from GraphQLFieldConfig
* @returns {boolean} true if the field is a Float (GraphQLFloat)
*/

export function isFloat(field: Map<string, *>): boolean {
    return field.get('type').name === FLOAT_TYPE_NAME
}

/*
* Checks if a Map<GraphQLFieldConfig> from a graphql schema is a int
* @private
* @params {Map} field immutable map from GraphQLFieldConfig
* @returns {boolean} true if the field is a Int (GraphQLInt)
*/
export function isInt(field: Map<string, *>): boolean {
    return field.get('type').name === INT_TYPE_NAME
}

/*
* Checks if a Map<GraphQLFieldConfig> from a graphql schema is a string
* Checks if a Map from a graphql schema is a string
* @private
* @returns {boolean} true if the field is a String (GraphQLString)
*/

export function isString(field: Map<string, *>): boolean {
    return field.get('type').name === STRING_TYPE_NAME
}

//fieldResolver resolver for the type that we are creating the filds for.
function CreateFields(type: GraphQLOutputType,
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
                    resolve: (obj): GraphQLFieldConfig => {
                        return resolver(field.get('resolve'), key, obj, field) 
                    }
                }))
            }
            return resultFields;
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


const filterFunctions = (field) => ({
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
        return not == null || !runFilterFunction(field)(not, obj)
    },
    // or:  ({or}, value: number): boolean => {
    //     return true //or != null && //runFilterFunction(not, value)
    // }

})

var runFilterFunction = (field) => (args, ii) => {
    return filterFunctions(field).gt(args, field.get('resolve')(ii)) 
        && filterFunctions(field).lt(args, field.get('resolve')(ii)) 
        && filterFunctions(field).gte(args, field.get('resolve')(ii)) 
        && filterFunctions(field).lte(args, field.get('resolve')(ii)) 
        && filterFunctions(field).equal(args, field.get('resolve')(ii)) 
        && filterFunctions(field).not(args, field.get('resolve')(ii), ii) 
        //&& filterFunctions.or(args, field.get('resolve')(ii));
}

var resolveIntFilter = (field) => (obj, args) => {
    return fromJS(obj).filter(ii => runFilterFunction(field)(args, ii.toJS())).toJS()
}

function filterFieldConfigFactory(fields, field: Map<string, *>, key: string, type: GraphQLObjectType): GraphQLFieldConfig{
    if(isInt(field)){
        return fields.set(key, Map({
            type: AggregationType(type),
            args: filterIntArgs,
            resolve: resolveIntFilter(field),
            description: `Filters ${key} via args.`
        }))
    }
    if(isString(field)){
        return fields.set(key, Map({
            type: AggregationType(type),
            args: filterStringArgs,
            resolve: resolveIntFilter(field),
            description: `Filters ${key} via args.`
        }))
    }
    return fields;
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
            fields: (): GraphQLFieldConfigMap => ({
                values : {
                    description: `List of ${type.name}`,
                    type: new GraphQLList(type),
                    resolve: (obj: Array<*>): GraphQLList<*> => obj
                },
                count : {
                    description: 'Size of the amount of items',
                    type: GraphQLInt,
                    resolve: (obj: Array<*>): number => obj.length

                },
                first: {
                    description: 'Return the first item',
                    type: type,
                    resolve: (obj: Array<*>): * => fromJS(obj).first().toJS()
                },
                last: {
                    description: 'Return the last item',
                    type: type,
                    resolve: (obj: Array<*>): * => fromJS(obj).last().toJS()
                },
                reverse: {
                    description: 'Reverse the order of the list',
                    type: AggregationType(type),
                    resolve: (obj: Array<*>): * => fromJS(obj).reverse().toJS()
                },
                //slice: {}
                // sort: {
                //     description: 'Sort the list via the parameter',
                //     fields: () =>
                //         CreateFields(type, 
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

                            return CreateFields(type, 
                                KeyedList(type), 
                                (fieldResolver: * , key: string, obj: *) => {
                                    return fromJS(obj).groupBy(ii => fieldResolver(ii.toJS())).toJS()
                                }, 
                                () => true 
                            )
                        }
                    }),
                    description: `Preform a groupBy aggregation method on ${type.name}`,
                    resolve: (obj) => obj
                },
                filter: {
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
                },
                sum: { 
                    description: `Perform sum on ${type.name}`,
                    type: new GraphQLObjectType({
                        name: `${type.name}Sum`,
                        description: `Perform sum on ${type.name}`,
                        fields: () => {
                            return CreateFields(type, 
                                GraphQLFloat, 
                                (fieldResolver: * , key: string, obj: *) => {
                                    return fromJS(obj).update(imMath.sumBy(ii => fieldResolver(ii.toJS())))
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
                            return CreateFields(type, 
                                GraphQLFloat, 
                                (fieldResolver: * , key: string, obj: *) => {
                                    return fromJS(obj).update(imMath.averageBy(ii => fieldResolver(ii.toJS())))
                                }, 
                                (field) => isFloat(field) || isInt(field))
                        }
                    }),
                    resolve: (obj) => obj
                },
                min: {
                    description: `Returns the average of a field on ${type.name}`,
                    type: new GraphQLObjectType({
                        name: `${type.name}Min`,
                        description: `Perform averages on ${type.name}`,
                        fields: () => {
                            return CreateFields(type, 
                                GraphQLFloat, 
                                (fieldResolver: * , key: string, obj: *) => {
                                    return fromJS(obj).update(imMath.minBy(ii => fieldResolver(ii.toJS())))
                                }, 
                                (field) => isFloat(field) || isInt(field))
                        }
                    }),
                    resolve: (obj) => obj
                },
                max: {
                    description: `Returns the average of a field on ${type.name}`,
                    type: new GraphQLObjectType({
                        name: `${type.name}Max`,
                        description: `Perform averages on ${type.name}`,
                        fields: () => {
                            return CreateFields(type, 
                                GraphQLFloat, 
                                (fieldResolver: * , key: string, obj: *) => {
                                    return fromJS(obj).update(imMath.maxBy(ii => fieldResolver(ii.toJS())))
                                }, 
                                (field) => isFloat(field) || isInt(field))
                        }
                    }),
                    resolve: (obj) => obj
                }
            })
        })
    }
    return aggregationTypes[type.name];
}
