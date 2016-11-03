'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.KeyedList = KeyedList;
exports.AggregationType = AggregationType;

var _immutable = require('immutable');

var _graphql = require('graphql');

var GeneralType = new _graphql.GraphQLScalarType({
    name: 'GeneralType',
    serialize: function serialize(value) {
        return value;
    },
    parseValue: function parseValue(value) {
        return value;
    },
    parseLiteral: function parseLiteral(ast) {
        return ast.value;
    }
});

// import imMath from 'immutable-math'

var imMath = require('immutable-math');

var INT_TYPE_NAME = 'Int';
var FLOAT_TYPE_NAME = 'Float';
var STRING_TYPE_NAME = 'String';

// var averageListTypes = {}
// export function AverageType(type){
//     if(!averageListTypes[type.name]){
//         averageListTypes[type.name] = new GraphQLObjectType({
//             name: `${type.name}Average`,
//             fields: () => {
//                 let types = fromJS(type._typeConfig.fields())
//                             .reduce((resultFields, field, key) => {
//                                 return resultFields.set(key, Map({
//                                     type: GeneralType,
//                                     resolve: (obj) => {
//                                         return obj.map(ii => {
//                                             return ii .reduce((rr, jj) => rr + jj.get(key), 0)
//                                         })
//                                     }
//                                 }))
//                             }, Map())
//                 return types.toJS();
//             }
//         });
//     }
//     return averageListTypes[type.name]
// }


/**
 * A list that has an associated group of keys,
 * @param {GraphQLOutputType} type that the keyed list is based on
 * @returns a GraphQLObjectType that is specific for the graphql object type being aggregated.
 */

// Because there is no way other then other then returning a
// GraphQLScalarType to have key value pairs, and then
// we have no way of adding more aggregations

var keyedListTypes = {};
function KeyedList(type) {
    if (!keyedListTypes[type.name]) {
        keyedListTypes[type.name] = new _graphql.GraphQLObjectType({
            name: type.name + 'KeyedList',
            fields: function fields() {
                return {
                    keys: {
                        type: new _graphql.GraphQLList(_graphql.GraphQLString),
                        description: 'Keys after aggregation',
                        resolve: function resolve(obj) {
                            return obj.keySeq().toJS();
                        }
                    },
                    values: {
                        type: new _graphql.GraphQLList(AggregationType(type)),
                        description: 'Values after aggregation ' + type.name,
                        resolve: function resolve(obj) {
                            return obj.valueSeq().toJS();
                        }
                    }
                };
            }
        });
    }
    return keyedListTypes[type.name];
}

/**
 * This is going to get hectic, but we are going to have one of these for each field on the type... I think
 */
// var filterFuncTypes = {};
// export function FilterFunctions(type, field){
//     if(!filterFuncTypes[type.name]){
//         filterFuncTypes[type.name] = {};
//     }
//     if(!filterFuncTypes[type.name][field]){
//         filterFuncTypes[type.name][field] = new GraphQLObjectType({
//             name: `${field}${type.name}FilterFunctions`,
//             description: `Preform function to filter ${type.name} , ${field}`,
//             fields: () => ({
//                 gt : {
//                     description: `List of ${type.name}`,
//                     type: new GraphQLList(type),
//                     resolve: (obj) => obj
//                 },
//                 lt: {

//                 },
//                 equal : {

//                 }
//             })
//         })
//     }
//     return filterFuncTypes[type.name][field];
// }

// const filterFunctions = new GraphQLObjectType({
//     name: `FilterFunctions`,
//     description: `Preform function to filter`,
//     fields: () => ({
//         gt : {
//             description: `List of ${type.name}`,
//             type: new GraphQLList(type),
//             args:{

//             }
//             resolve: (obj) => obj.get('values').filter(v => v.get(obj.get(obj.filterType)))
//         },
//         lt: {

//         },
//         equal : {

//         }
//     })
// });

/*
* Checks if a Map<GraphQLFieldConfig> from a graphql schema is a float
* @params {Map} field immutable map from GraphQLFieldConfig
* @returns {boolean} true if the field is a Float (GraphQLFloat)
*/

function isFloat(field) {
    return field.get('type').name === FLOAT_TYPE_NAME;
}

/*
* Checks if a Map<GraphQLFieldConfig> from a graphql schema is a int
* @params {Map} field immutable map from GraphQLFieldConfig
* @returns {boolean} true if the field is a Int (GraphQLInt)
*/
function isInt(field) {
    return field.get('type').name === INT_TYPE_NAME;
}

/*
* Checks if a Map<GraphQLFieldConfig> from a graphql schema is a string
* Checks if a Map from a graphql schema is a string
* @returns {boolean} true if the field is a String (GraphQLString)
*/

function isString(field) {
    return field.get('type').name === STRING_TYPE_NAME;
}

//fieldResolver resolver for the type that we are creating the filds for.
function CreateFields(type, returnType, resolver, typeCheck) {

    var fields = type._typeConfig.fields();
    return (0, _immutable.fromJS)(fields).reduce(function (resultFields, field, key) {
        if (typeCheck(field)) {
            //if(validFieldTypesList == null || validFieldTypesList.includes(field.get('type').name)){
            return resultFields.set(key, (0, _immutable.Map)({
                type: returnType,
                resolve: function resolve(obj) {
                    return resolver(field.get('resolve'), key, obj);
                }
            }));
            //}
        }
        return resultFields;
    }, (0, _immutable.Map)()).toJS();
}

// field, key

/**
 * Creates an AggregationType with a buvbased on the GraphQLOutputType requested,
 * Objects that wished to be resolved this way must be a Array of the requested type.
 *
 *   =
 * @param {GraphQLOutputType} type - type to create the aggregaion functions for
 */

var aggregationTypes = {};
function AggregationType(type) {
    if (!aggregationTypes[type.name]) {
        aggregationTypes[type.name] = new _graphql.GraphQLObjectType({
            name: type.name + 'Aggregation',
            description: 'Preform aggregation methods on ' + type.name,
            fields: function fields() {
                return {
                    values: {
                        description: 'List of ' + type.name,
                        type: new _graphql.GraphQLList(type),
                        resolve: function resolve(obj) {
                            return obj;
                        }
                    },

                    // groupedByNew : {
                    //     type: new GraphQLObjectType({
                    //         name: `${type.name}GroupedByNewAggregation`,
                    //         description: `Preform groupBy aggregation methods on ${type.name}`,
                    //         fields: () => {
                    //             let types = fromJS(type._typeConfig.fields())
                    //                 .reduce((resultFields, field, key) => {
                    //                     return resultFields.set(key, Map({
                    //                         type: new GraphQLList(AggregationType(type)),
                    //                         resolve: (obj) => fromJS(obj)
                    //                             .groupBy(v => v.get(key))
                    //                     }))
                    //                 }, Map())
                    //             return types.toJS();
                    //         },
                    //         resolve: (obj) => obj
                    //     })
                    // },

                    groupedBy: {
                        type: new _graphql.GraphQLObjectType({
                            name: type.name + 'GroupedByAggregation',
                            description: 'Preform groupBy aggregation methods on ' + type.name,
                            fields: function fields() {
                                return CreateFields(type, KeyedList(type), function (fieldResolver, key, obj) {
                                    return (0, _immutable.fromJS)(obj).groupBy(function (ii) {
                                        return fieldResolver(ii);
                                    });
                                }, function () {
                                    return true;
                                });
                            }
                        }),
                        description: 'Preform a groupBy aggregation method on ' + type.name,
                        resolve: function resolve(obj) {
                            return obj;
                        }
                    },
                    sum: {
                        description: 'Perform sum on ' + type.name,
                        type: new _graphql.GraphQLObjectType({
                            name: type.name + 'Sum',
                            description: 'Perform sum on ' + type.name,
                            fields: function fields() {
                                return CreateFields(type, _graphql.GraphQLFloat, function (fieldResolver, key, obj) {
                                    return (0, _immutable.fromJS)(obj).update(imMath.sumBy(function (ii) {
                                        return fieldResolver(ii);
                                    }));
                                }, function (field) {
                                    return isFloat(field) || isInt(field);
                                });
                            }
                        }),
                        resolve: function resolve(obj) {
                            return obj;
                        }
                    }

                    // sum: { 
                    //     type: new GraphQLObjectType({
                    //         name: `${type.name}Sum`,
                    //         description: `Perform sum on ${type.name}`,
                    //         fields: () => {
                    //             let types = fromJS(type._typeConfig.fields())
                    //                 .reduce((resultFields, field, key) => {
                    //                     if(isFloat(field) || isInt(field)){
                    //                         return resultFields.set(key, Map({
                    //                             type: GraphQLFloat,
                    //                             resolve: (obj) => fromJS(obj)
                    //                                 .update(imMath.sumBy(ii => field.get('resolve')(ii)))
                    //                         }))
                    //                     }
                    //                     return resultFields;
                    //                 }, Map())
                    //             return types.toJS();
                    //         }
                    //     }),
                    //     description: `Perform sum on ${type.name}`,
                    //     resolve: (obj) => obj
                    // }
                    // filter : {
                    //     name: `${type.name}FilterAggregation`,
                    //     description: `Preform filter aggregation methods on ${type.name}`,
                    //     args: {
                    //         gt: {
                    //             type: GeneralType,
                    //             description: `Check if value is `
                    //         }
                    //     }
                    //     fields: () => {
                    //         let types = fromJS(type._typeConfig.fields())
                    //             .reduce((resultFields, field, key) => {
                    //                 return resultFields.set(key, Map({
                    //                     type: KeyedList(type),
                    //                     resolve: (obj) => fromJS(obj)
                    //                         .groupBy(v => v.get(key))
                    //                 }))
                    //             }, Map())
                    //         return types.toJS();
                    //     }
                    // }
                };
            }
        });
    }
    return aggregationTypes[type.name];
}